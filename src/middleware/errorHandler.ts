import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

function isMalformedJsonError(err: unknown): boolean {
  return err instanceof SyntaxError && "body" in err;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const appError = err instanceof AppError
    ? err
    : isMalformedJsonError(err)
    ? AppError.validation("Malformed JSON in request body")
    : null;

  if (appError) {
    logger.warn("request failed", {
      method: req.method,
      path: req.path,
      code: appError.code,
      status: appError.status,
    });
    res.status(appError.status).json({
      error: {
        code: appError.code,
        message: appError.message,
        status: appError.status,
        details: appError.details,
      },
    });
    return;
  }

  logger.error("unhandled error", {
    method: req.method,
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({
    error: {
      code: "internal_error",
      message: "An unexpected error occurred",
      status: 500,
    },
  });
}
