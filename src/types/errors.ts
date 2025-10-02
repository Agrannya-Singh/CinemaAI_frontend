export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface AuthError extends Error {
  code?: string;
  message: string;
}