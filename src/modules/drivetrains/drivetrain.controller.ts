import type { RequestHandler, Response } from "express";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success } from "../../utils/https";
import { create, update, removeMany, getAll, getById } from "./drivetrain.service";

const guardFail = (res: Response, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

export const createDrivetrain: RequestHandler = async (req, res) => {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];

    const payload = items.map((x) => ({
        type: x.type ?? null,
        description: x.description ?? null,
    }));

    try {
        const result = await create(payload);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateDrivetrain: RequestHandler<{ id: string }> = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    const type = body?.type;
    const description = body?.description;

    if (type === undefined && description === undefined) {
        return badRequest(res, "Missing required field", { field: "type or description" });
    }

    try {
        const result = await update(id, {
            ...(type !== undefined ? { type } : {}),
            ...(description !== undefined ? { description } : {}),
        });

        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteDrivetrains: RequestHandler = async (req, res) => {
    const body = req.body;

    let ids: string[] = [];

    if (Array.isArray(body)) {
        for (const item of body) {
            if (typeof item === "string") ids.push(item);
            else if (item?.id) ids.push(item.id);
        }
    } else {
        if (Array.isArray(body?.ids)) ids = body.ids;
        if (body?.id) ids.push(body.id);
    }

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await removeMany(ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getDrivetrains: RequestHandler = async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    try {
        const result = await getAll(search);
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getDrivetrain: RequestHandler<{ id: string }> = async (req, res) => {
    const { id } = req.params;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await getById(id);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};
