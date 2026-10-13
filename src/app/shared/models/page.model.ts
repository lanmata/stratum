export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function emptyPage<T>(size: number): Page<T> {
  return { content: [], page: 0, size, totalElements: 0, totalPages: 0 };
}
