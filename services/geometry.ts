
export interface Point {
  x: number;
  y: number;
}

/**
 * Parses a basic WKT Polygon string into an array of points.
 * Supports format: POLYGON ((x1 y1, x2 y2, ...))
 */
export function parseWktPolygon(wkt: string): Point[] {
  try {
    // Extract content inside the double parentheses
    const match = wkt.match(/POLYGON\s*\(\((.*?)\)\)/i);
    if (!match || !match[1]) {
      return [];
    }
    
    const coordString = match[1];
    // Split by comma first
    const pairs = coordString.split(',');
    
    const points = pairs.map(pair => {
      // Split by whitespace to get X and Y
      const parts = pair.trim().split(/\s+/);
      if (parts.length >= 2) {
        return {
          x: parseFloat(parts[0]),
          y: parseFloat(parts[1])
        };
      }
      return null;
    }).filter((p): p is Point => p !== null);

    return points;
  } catch (e) {
    console.error("Failed to parse WKT:", e);
    return [];
  }
}

/**
 * Ray-casting algorithm to check if a point is inside a polygon.
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if two line segments (p1-p2 and q1-q2) intersect.
 */
function doLineSegmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const det = (p2.x - p1.x) * (q2.y - q1.y) - (q2.x - q1.x) * (p2.y - p1.y);
  if (det === 0) {
    return false; // Parallel lines
  }
  const lambda = ((q2.y - q1.y) * (q2.x - p1.x) + (q1.x - q2.x) * (q2.y - p1.y)) / det;
  const gamma = ((p1.y - p2.y) * (q2.x - p1.x) + (p2.x - p1.x) * (q2.y - p1.y)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

/**
 * Determines if a polyline (sequence of points) intersects with or is contained by a polygon.
 */
export function isPolylineVisible(entityPoints: Point[], polygon: Point[]): boolean {
  if (entityPoints.length === 0) return false;

  // 1. Check if any point of the entity is inside the polygon
  // This covers cases where the entity is fully inside or partially inside
  if (entityPoints.some(p => isPointInPolygon(p, polygon))) {
    return true;
  }

  // 2. Check if any segment of the entity intersects any edge of the polygon
  // This covers cases where the entity passes through the polygon but all vertices are outside
  // (e.g., a long line crossing a small crop window)
  
  // Iterate through entity segments
  for (let i = 0; i < entityPoints.length - 1; i++) {
    const p1 = entityPoints[i];
    const p2 = entityPoints[i+1];

    // Iterate through polygon edges
    for (let j = 0; j < polygon.length - 1; j++) {
      const q1 = polygon[j];
      const q2 = polygon[j+1];
      
      if (doLineSegmentsIntersect(p1, p2, q1, q2)) {
        return true;
      }
    }
    // Check closing edge of polygon
    const qLast = polygon[polygon.length - 1];
    const qFirst = polygon[0];
    if (doLineSegmentsIntersect(p1, p2, qLast, qFirst)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple visibility check for a circle based on its center and radius.
 * If radius is unknown (0), it falls back to point-in-polygon check for center.
 */
export function isCircleVisible(center: Point, radius: number, polygon: Point[]): boolean {
  // 1. Center inside
  if (isPointInPolygon(center, polygon)) return true;

  // 2. If radius is provided, check if the circle's bounding box intersects the polygon's bounding box
  // (This is a simplified approximation to avoid complex circle-segment intersection math)
  if (radius > 0) {
    // Polygon Bounding Box
    const minX = Math.min(...polygon.map(p => p.x));
    const maxX = Math.max(...polygon.map(p => p.x));
    const minY = Math.min(...polygon.map(p => p.y));
    const maxY = Math.max(...polygon.map(p => p.y));

    // Circle Bounding Box
    const cMinX = center.x - radius;
    const cMaxX = center.x + radius;
    const cMinY = center.y - radius;
    const cMaxY = center.y + radius;

    // Check intersection of AABB
    if (cMinX <= maxX && cMaxX >= minX && cMinY <= maxY && cMaxY >= minY) {
        // Overlap detected (approximate)
        return true;
    }
  }

  return false;
}
