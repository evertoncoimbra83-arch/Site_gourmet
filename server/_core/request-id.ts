import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

export function getRequestIdFromRequest(req: Request): string {
  const incoming =
    req.headers["x-request-id"] || req.headers["x-correlation-id"];
  const requestId = Array.isArray(incoming) ? incoming[0] : incoming;
  return requestId || crypto.randomUUID();
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId = getRequestIdFromRequest(req);
  (req as any).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
