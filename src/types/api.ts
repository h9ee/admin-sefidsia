export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type ApiError = {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};

export type Id = string | number;

export type Status = "active" | "inactive" | "pending" | "banned";
