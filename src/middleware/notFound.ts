import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound("route_not_found", `No route for ${req.method} ${req.path}`));
}
