import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "";

export type AuthedRequest = Request & { user?: { id: string; email: string } };

//TODO: put this file into middlewares folder
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing Authorization header" });
      return;
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, ACCESS_SECRET) as any;

    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
