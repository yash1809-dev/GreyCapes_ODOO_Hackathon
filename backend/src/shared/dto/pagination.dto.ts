import { z } from 'zod';

/**
 * Pagination query parameters schema
 */
export const PaginationSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export type PaginationQuery = z.infer<typeof PaginationSchema>;

export interface PaginationParams {
  skip: number;
  take: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export function getPaginationParams(query: PaginationQuery): PaginationParams {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10)); // Max 100 items per page

  const params: PaginationParams = {
    skip: (page - 1) * limit,
    take: limit
  };

  if (query.sortBy) {
    params.orderBy = {
      [query.sortBy]: query.sortOrder || 'desc'
    };
  }

  return params;
}
