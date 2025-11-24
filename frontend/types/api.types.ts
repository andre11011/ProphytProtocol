export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    timestamp?: string;
  };
  error?: string;
  details?: string;
}
