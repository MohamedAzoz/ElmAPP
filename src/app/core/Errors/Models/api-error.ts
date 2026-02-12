export interface ApiError {
  status: number;
  message: string;
  errors?: { [key: string]: string[] };
  timestamp?: string;
  path?: string;
}

export interface ValidationError {
  field: string;
  messages: string[];
}

export function parseApiError(error: any): ApiError {
  return {
    status: error.status || 500,
    message: error.error?.message || error.message || 'حدث خطأ غير متوقع',
    errors: error.error?.errors,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
  };
}
