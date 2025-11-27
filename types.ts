export interface ProcessResult {
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  VALIDATING = 'VALIDATING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface ValidationResponse {
  isValid: boolean;
  description: string;
  geometryType: string;
}