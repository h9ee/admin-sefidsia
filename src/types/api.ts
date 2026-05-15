export type ApiEnvelope<T> = {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
};

export type ApiFailureEnvelope = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

export type Id = string;
