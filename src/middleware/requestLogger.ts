import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info("request completed", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
