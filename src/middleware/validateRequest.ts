import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import { AppError } from "../errors/AppError";

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
      };
    }
  }
}

// A request whose validated fields are guaranteed present and precisely typed. Controllers
// declare their handler's `req` as this (via asyncHandler's generic) to get exact inference
// for req.validated.body/params/query, instead of `req.validated!.body as SomeBody`.
export interface ValidatedRequest<TBody = unknown, TParams = unknown, TQuery = unknown>
  extends Request {
  validated: {
    body: TBody;
    params: TParams;
    query: TQuery;
  };
}

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validateRequest(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated: NonNullable<Request["validated"]> = {};
      if (schemas.body) validated.body = schemas.body.parse(req.body ?? {});
      if (schemas.params) validated.params = schemas.params.parse(req.params);
      if (schemas.query) validated.query = schemas.query.parse(req.query);
      req.validated = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          AppError.validation("Request validation failed", {
            issues: err.issues.map((issue) => ({
              path: issue.path.join(".") || undefined,
              message: issue.message,
            })),
          })
        );
        return;
      }
      next(err);
    }
  };
}
