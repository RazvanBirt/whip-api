import type { RequestHandler } from "express";

import {
    badRequest,
    serverError,
    success,
} from "../../utils/https";

import type { AuthedRequest } from "../auth/auth.middleware";

import {
    findUserTheme,
    saveUserTheme,
} from "./users.service";

function getUserId(req: AuthedRequest) {
    return req.user?.id;
}

export const getMyTheme: RequestHandler = async (
    req: AuthedRequest,
    res
) => {
    const userId = getUserId(req);

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    try {
        const result = await findUserTheme(userId);

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateMyTheme: RequestHandler = async (
    req: AuthedRequest,
    res
) => {
    const userId = getUserId(req);
    const body = req.body;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    if (
        typeof body?.darkTheme !== "boolean" ||
        typeof body?.primary !== "string" ||
        typeof body?.preset !== "string"
    ) {
        return badRequest(res, "Invalid theme");
    }

    if (
        body.surface !== null &&
        body.surface !== undefined &&
        typeof body.surface !== "string"
    ) {
        return badRequest(res, "Invalid surface");
    }

    try {
        const result = await saveUserTheme(userId, {
            darkTheme: body.darkTheme,
            primary: body.primary,
            surface: body.surface ?? null,
            preset: body.preset,
        });

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};