import type { RequestHandler } from "express";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success } from "../../utils/https";
import {
    create,
    getById,
    attachEngines,
    detachEngines,
    attachTransmissions,
    detachTransmissions,
    attachDrivetrains,
    detachDrivetrains,
} from "./modelYear.service";

const guardFail = (res: any, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

export const createModelYear: RequestHandler = async (req: any, res: any) => {
    const body = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: body?.modelId, argumentName: "modelId" },
        { argument: body?.year, argumentName: "year" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await create(body.modelId, Number(body.year));
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getModelYear: RequestHandler = async (req: any, res: any) => {
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

// attach/detach use same ids parsing style as you used for deleteMakes
const readIds = (body: any) => {
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

    return ids;
};

export const addEnginesToModelYear: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const ids = readIds(req.body);

    const guard = Guard.againstNullOrUndefined(id, "modelYearId");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await attachEngines(id, ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const removeEnginesFromModelYear: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const ids = readIds(req.body);

    const guard = Guard.againstNullOrUndefined(id, "modelYearId");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await detachEngines(id, ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

// transmissions
export const addTransmissionsToModelYear: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const ids = readIds(req.body);

    const guard = Guard.againstNullOrUndefined(id, "modelYearId");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await attachTransmissions(id, ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const removeTransmissionsFromModelYear: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const ids = readIds(req.body);

    const guard = Guard.againstNullOrUndefined(id, "modelYearId");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await detachTransmissions(id, ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

// drivetrains
export const addDrivetrainsToModelYear: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const ids = readIds(req.body);

    const guard = Guard.againstNullOrUndefined(id, "modelYearId");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await attachDrivetrains(id, ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const removeDrivetrainsFromModelYear: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const ids = readIds(req.body);

    const guard = Guard.againstNullOrUndefined(id, "modelYearId");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!ids.length) return badRequest(res, "Missing required field", { field: "id(s)" });

    try {
        const result = await detachDrivetrains(id, ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};
