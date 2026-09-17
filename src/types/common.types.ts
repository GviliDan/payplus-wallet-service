export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PageParams {
  limit: number;
  offset: number;
}
