import type { Response } from "express";

export function badRequest(res: Response, message: string, details?: Record<string, any>) {
    return res.status(400).json({ error: message, ...details });
}

export function unauthorized(res: Response, message = "Unauthorized") {
    return res.status(401).json({ error: message });
}

export function forbidden(res: Response, message = "Forbidden") {
    return res.status(403).json({ error: message });
}

export function notFound(res: Response, message = "Not found") {
    return res.status(404).json({ error: message });
}

export function serverError(res: Response, error?: unknown) {
    if (error) console.error(error);
    return res.status(500).json({ error: "Internal server error" });
}

export function success<T>(res: Response, body: T) {
    return res.status(200).json(body);
}