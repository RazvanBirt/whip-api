import type { Response } from "express";

type JsonBody = Record<string, unknown> | unknown[] | null;

export function ok<T extends JsonBody>(res: Response, body: T) {
    return res.status(200).json(body);
}

export function created<T extends JsonBody>(res: Response, body: T) {
    return res.status(201).json(body);
}

export function noContent(res: Response) {
    return res.status(204).send();
}

export function badRequest(
    res: Response,
    message = "Bad request",
    details?: Record<string, unknown>
) {
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

export function conflict(
    res: Response,
    message = "Conflict",
    details?: Record<string, unknown>
) {
    return res.status(409).json({ error: message, ...details });
}

export function validationError(
    res: Response,
    message = "Validation error",
    details?: Record<string, unknown>
) {
    return res.status(422).json({ error: message, ...details });
}

export function unsupportedMediaType(
    res: Response,
    message = "Unsupported media type"
) {
    return res.status(415).json({ error: message });
}

export function serverError(res: Response, error?: unknown) {
    if (error) console.error(error);
    return res.status(500).json({ error: "Internal server error" });
}

// Backwards-compatible alias to migrate gradually.
export const success = ok;