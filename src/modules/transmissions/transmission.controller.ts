import type { RequestHandler, Response } from "express";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success } from "../../utils/https";
import { create, update, removeMany, getAll, getById } from "./transmission.service";

const guardFail = (res: Response, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

export const createTransmission: RequestHandler = async (req, res) => {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];

    // no required fields for Transmission in schema, so no bulk guard here

    const payload = items.map((x) => ({
        type: x.type ?? null,
        gears: x.gears ?? null,
    }));

    try {
        const result = await create(payload);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateTransmission: RequestHandler<{ id: string }> = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    const type = body?.type;
    let gears = body?.gears;
    if (gears !== undefined && gears !== null) {
        // allow "6" or 6
        const n = typeof gears === "string" ? Number(gears) : gears;
        if (!Number.isInteger(n)) {
        return badRequest(res, "Invalid field", { field: "gears", expected: "integer" });
        }
        gears = n;
    }


    
    if (type === undefined && gears === undefined) {
        return badRequest(res, "Missing required field", { field: "type or gears" });
    }

    try {
        console.log('Updating transmission:', { id, type, gears });
        const result = await update(id, {
            ...(type !== undefined ? { type } : {}),
            ...(gears !== undefined ? { gears } : {}),
        });

        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteTransmissions: RequestHandler = async (req, res) => {
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

export const getTransmissions: RequestHandler = async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    try {
        const result = await getAll(search);
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getTransmission: RequestHandler<{ id: string }> = async (req, res) => {
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
