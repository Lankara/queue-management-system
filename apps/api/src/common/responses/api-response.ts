export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    path?: string;
    timestamp: string;
  };
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  meta: ApiPaginationMeta;
}

export function successResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {})
  };
}

export function errorResponse(
  statusCode: number,
  message: string | string[],
  path?: string
): ApiErrorResponse {
  return {
    success: false,
    error: {
      statusCode,
      message,
      ...(path ? { path } : {}),
      timestamp: new Date().toISOString()
    }
  };
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): ApiPaginatedResponse<T> {
  return {
    success: true,
    data: items,
    ...(message ? { message } : {}),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}