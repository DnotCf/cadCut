
import { parseWktPolygon, isPointInPolygon, isPolylineVisible, isCircleVisible, Point } from './geometry';

/**
 * Reads a DXF file and returns a cropped version containing only entities
 * that intersect with the provided WKT polygon.
 */
export const processDxfFile = async (file: File, wkt: string): Promise<string> => {
  const text = await file.text();
  const polygon = parseWktPolygon(wkt);

  // If polygon is invalid, return original file (or throw error)
  if (polygon.length < 3) {
    throw new Error("Invalid WKT Polygon geometry.");
  }

  const lines = text.split(/\r?\n/);
  const output: string[] = [];
  
  let inEntitiesSection = false;
  
  // Entity State
  let currentEntity: string[] = [];
  let entityPoints: Point[] = [];
  let currentType: string = '';
  let currentRadius: number = 0;
  
  // Coordinate Buffers
  let currentX: number | null = null;
  let currentY: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const codeLine = lines[i].trim();
    if (i + 1 >= lines.length) break;
    const valueLine = lines[i + 1]; 
    const pair = `${codeLine}\n${valueLine}`;

    // --- SECTION HANDLING ---
    if (codeLine === '0' && valueLine.trim() === 'SECTION') {
      output.push(pair);
      i++;
      if (i + 2 < lines.length && lines[i+1].trim() === '2' && lines[i+2].trim() === 'ENTITIES') {
        inEntitiesSection = true;
        output.push(`${lines[i+1]}\n${lines[i+2]}`);
        i += 2;
      }
      continue;
    }

    if (codeLine === '0' && valueLine.trim() === 'ENDSEC') {
      // End of ENTITIES section? Flush pending entity.
      if (inEntitiesSection) {
        flushEntity(output, currentEntity, entityPoints, currentType, currentRadius, polygon);
        inEntitiesSection = false;
      }
      
      output.push(pair);
      i++;
      continue;
    }

    // --- ENTITY PARSING ---
    if (inEntitiesSection) {
      if (codeLine === '0') {
        // New Entity Start -> Flush Previous
        flushEntity(output, currentEntity, entityPoints, currentType, currentRadius, polygon);
        
        // Reset State
        currentEntity = [pair];
        currentType = valueLine.trim(); // e.g. LINE, LWPOLYLINE, CIRCLE
        entityPoints = [];
        currentRadius = 0;
        currentX = null;
        currentY = null;

      } else {
        // Inside Entity
        currentEntity.push(pair);

        // Parse Coordinates (10/20 or 11/21)
        // Note: DXF can have Z coordinates (30/31), we ignore them for 2D cropping.
        const code = parseInt(codeLine, 10);
        
        if (code === 10 || code === 11) {
           currentX = parseFloat(valueLine);
        }
        if (code === 20 || code === 21) {
           currentY = parseFloat(valueLine);
        }
        if (code === 40) {
           currentRadius = parseFloat(valueLine);
        }

        // When we have a pair (X,Y), store it
        if (currentX !== null && currentY !== null) {
          entityPoints.push({ x: currentX, y: currentY });
          currentX = null; 
          currentY = null;
        }
      }
    } else {
      // Not in ENTITIES (Header, Tables, etc.) -> Keep everything
      output.push(pair);
    }

    i++; // processed pair
  }

  // Final flush if file ends abruptly (though properly should have EOF)
  if (inEntitiesSection && currentEntity.length > 0) {
     flushEntity(output, currentEntity, entityPoints, currentType, currentRadius, polygon);
  }

  return output.join('\n');
};

/**
 * Decides whether to keep the entity and pushes it to output if valid.
 */
function flushEntity(
  output: string[], 
  entityLines: string[], 
  points: Point[], 
  type: string, 
  radius: number,
  polygon: Point[]
) {
  if (entityLines.length === 0) return;

  let keep = false;

  // Logic based on Entity Type
  switch (type) {
    case 'LINE':
    case 'LWPOLYLINE':
    case 'POLYLINE':
    case 'SPLINE':
      // Check for containment OR intersection
      keep = isPolylineVisible(points, polygon);
      break;
    
    case 'CIRCLE':
    case 'ARC':
      // Check center + radius approximation
      if (points.length > 0) {
        keep = isCircleVisible(points[0], radius, polygon);
      }
      break;

    case 'POINT':
    case 'INSERT': // Blocks
    case 'TEXT':
    case 'MTEXT':
      // For single point entities, just check if point is inside
      if (points.length > 0) {
        keep = isPointInPolygon(points[0], polygon);
      } else {
        // If entity has no geometry (e.g. dict, meta), keep it to be safe
        keep = true;
      }
      break;

    default:
      // Unknown entities: Strategy -> Keep if they have points inside, 
      // otherwise keep them if they have NO points (likely metadata).
      if (points.length > 0) {
        keep = isPolylineVisible(points, polygon);
      } else {
        keep = true; 
      }
      break;
  }

  if (keep) {
    output.push(...entityLines);
  }
}
