/**
 * Standard API Response Format
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseBuilder {
  static success<T>(data: T, message?: string, pagination?: any): ApiResponse<T> | PaginatedResponse<any> {
    if (pagination) {
      return {
        success: true,
        data: data as any,
        pagination: {
          ...pagination,
          hasNext: pagination.page < pagination.totalPages,
          hasPrev: pagination.page > 1
        }
      };
    }
    
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...(message && { message })
      }
    };
  }

  static error(message: string, code: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}
