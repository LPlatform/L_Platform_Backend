export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  badRequest: (message = 'Bad request', details?: unknown) =>
    new AppError(400, 'BAD_REQUEST', message, details),
  unauthorized: (message = 'Authentication required', details?: unknown) =>
    new AppError(401, 'UNAUTHORIZED', message, details),
  forbidden: (message = 'Access denied', details?: unknown) =>
    new AppError(403, 'FORBIDDEN', message, details),
  notFound: (message = 'Resource not found', details?: unknown) =>
    new AppError(404, 'NOT_FOUND', message, details),
  conflict: (message = 'Resource already exists', details?: unknown) =>
    new AppError(409, 'CONFLICT', message, details),
  internal: (message = 'Internal server error', details?: unknown) =>
    new AppError(500, 'INTERNAL_SERVER_ERROR', message, details),
};
