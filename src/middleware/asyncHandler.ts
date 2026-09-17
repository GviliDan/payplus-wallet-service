import { NextFunction, Request, Response } from "express";

type Handler<TReq extends Request> = (req: TReq, res: Response, next: NextFunction) => Promise<unknown>;

// Forwards rejected promises from async route handlers to Express's error middleware.
//
// TReq lets a controller declare its req as ValidatedRequest<Body, Params, Query> (see
// validateRequest.ts) and read req.validated.body etc. with no `!` or `as` casts. Express's
// type system can't express "the earlier validateRequest middleware narrowed req's type",
// so this single, centralized cast bridges that gap; it's sound because validateRequest
// always runs before the controller in the route's middleware chain.
export function asyncHandler<TReq extends Request = Request>(handler: Handler<TReq>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as TReq, res, next).catch(next);
  };
}
