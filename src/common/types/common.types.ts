export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  results: T[];
  pagination: {
    total: number;
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}
