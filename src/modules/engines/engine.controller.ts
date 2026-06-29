import type { RequestHandler, Response } from "express";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success } from "../../utils/https";
import { create, update, removeMany, getAll, getById } from "./engine.service";

const guardFail = (res: Response, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

export const createEngine: RequestHandler = async (req, res) => {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];

    for (let i = 0; i < items.length; i++) {
        const guard = Guard.againstNullOrUndefinedBulk([
            { argument: items[i]?.code, argumentName: `code[${i}]` },
        ]);
        if (!guard.succeeded) return guardFail(res, guard.argumentName);
    }

    const payload = items.map((x) => ({
        code: x.code,
        configuration: x.configuration ?? null,
        displacementLiters: x.displacementLiters ?? null,
        displacementCc: x.displacementCc ?? null,
        cylinders: x.cylinders ?? null,
        fuelType: x.fuelType ?? null,
        aspiration: x.aspiration ?? null,
        powerPs: x.powerPs ?? null,
        powerKw: x.powerKw ?? null,
        torqueNm: x.torqueNm ?? null,
        torqueLbft: x.torqueLbft ?? null,
    }));

    try {
        const result = await create(payload);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateEngine: RequestHandler<{ id: string }> = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    const code = body?.code;
    const configuration = body?.configuration;
    const displacementLiters = body?.displacementLiters;
    const displacementCc = body?.displacementCc;
    const cylinders = body?.cylinders;
    const fuelType = body?.fuelType;
    const aspiration = body?.aspiration;
    const powerPs = body?.powerPs;
    const powerKw = body?.powerKw;
    const torqueNm = body?.torqueNm;
    const torqueLbft = body?.torqueLbft;

    if (
        code === undefined &&
        configuration === undefined &&
        displacementLiters === undefined &&
        displacementCc === undefined &&
        cylinders === undefined &&
        fuelType === undefined &&
        aspiration === undefined &&
        powerPs === undefined &&
        powerKw === undefined &&
        torqueNm === undefined &&
        torqueLbft === undefined
    ) {
        return badRequest(res, "Missing required field", { field: "fields to update" });
    }

    try {
        const result = await update(id, {
            ...(code !== undefined ? { code } : {}),
            ...(configuration !== undefined ? { configuration } : {}),
            ...(displacementLiters !== undefined ? { displacementLiters } : {}),
            ...(displacementCc !== undefined ? { displacementCc } : {}),
            ...(cylinders !== undefined ? { cylinders } : {}),
            ...(fuelType !== undefined ? { fuelType } : {}),
            ...(aspiration !== undefined ? { aspiration } : {}),
            ...(powerPs !== undefined ? { powerPs } : {}),
            ...(powerKw !== undefined ? { powerKw } : {}),
            ...(torqueNm !== undefined ? { torqueNm } : {}),
            ...(torqueLbft !== undefined ? { torqueLbft } : {}),
        });

        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteEngines: RequestHandler = async (req, res) => {
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

export const getEngines: RequestHandler = async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    try {
        const result = await getAll(search);
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getEngine: RequestHandler<{ id: string }> = async (req, res) => {
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
