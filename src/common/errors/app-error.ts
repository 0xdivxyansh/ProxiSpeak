import { ErrorCode, ErrorCodes } from './error-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: unknown[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details: unknown[] = [],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details: unknown[] = []) {
    super(400, ErrorCodes.BAD_REQUEST, message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The request contains invalid fields', details: unknown[] = []) {
    super(400, ErrorCodes.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required or invalid credentials', details: unknown[] = []) {
    super(401, ErrorCodes.UNAUTHORIZED, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to access this resource',
    details: unknown[] = [],
  ) {
    super(403, ErrorCodes.FORBIDDEN, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found', details: unknown[] = []) {
    super(404, ErrorCodes.NOT_FOUND, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details: unknown[] = []) {
    super(409, ErrorCodes.CONFLICT, message, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload exceeds maximum permitted size', details: unknown[] = []) {
    super(413, ErrorCodes.PAYLOAD_TOO_LARGE, message, details);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported media content type', details: unknown[] = []) {
    super(415, ErrorCodes.UNSUPPORTED_MEDIA_TYPE, message, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity', details: unknown[] = []) {
    super(422, ErrorCodes.UNPROCESSABLE_ENTITY, message, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later', details: unknown[] = []) {
    super(429, ErrorCodes.TOO_MANY_REQUESTS, message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred', details: unknown[] = []) {
    super(500, ErrorCodes.INTERNAL_SERVER_ERROR, message, details, false);
  }
}
