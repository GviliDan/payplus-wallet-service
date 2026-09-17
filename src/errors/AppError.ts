export class AppError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static notFound(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 404, details);
  }

  static conflict(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 409, details);
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new AppError("validation_error", message, 400, details);
  }
}
