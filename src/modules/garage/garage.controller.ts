import type { RequestHandler } from "express";
import { badRequest, serverError, success } from "../../utils/https";
import type { AuthedRequest } from "../auth/auth.middleware";
import {
    createGarageCar,
    findGarageCarById,
    findMyGarage,
    patchGarageCar,
    removeGarageCar,
} from "./garage.service";

function getUserId(req: AuthedRequest) {
    return req.user?.id;
}

export const getMyGarage: RequestHandler = async (req: AuthedRequest, res) => {
    const userId = getUserId(req);

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const result = await findMyGarage(userId);
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getGarageCar: RequestHandler = async (req: AuthedRequest, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const result = await findGarageCarById(userId, Array.isArray(id) ? id[0] : id);

        if (!result.success) {
            return badRequest(res, result.error);
        }

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const addCarToGarage: RequestHandler = async (req: AuthedRequest, res) => {
    const userId = getUserId(req);
    const body = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!body?.versionConfigId) {
        return badRequest(res, "Missing required field", {
            field: "versionConfigId",
        });
    }

    try {
        const result = await createGarageCar(userId, {
            versionConfigId: body.versionConfigId,
            nickname: body.nickname,
            vin: body.vin,
            licensePlate: body.licensePlate,
            color: body.color,
            mileageKm:
                body.mileageKm === undefined || body.mileageKm === null
                    ? null
                    : Number(body.mileageKm),
            isPrimary: Boolean(body.isPrimary),
        });

        if (!result.success) {
            return badRequest(res, result.error);
        }

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateGarageCar: RequestHandler = async (
    req: AuthedRequest,
    res
) => {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const data = {
        ...(body.nickname !== undefined ? { nickname: body.nickname } : {}),
        ...(body.vin !== undefined ? { vin: body.vin } : {}),
        ...(body.licensePlate !== undefined
            ? { licensePlate: body.licensePlate }
            : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.mileageKm !== undefined
            ? {
                mileageKm:
                    body.mileageKm === null ? null : Number(body.mileageKm),
            }
            : {}),
        ...(body.isPrimary !== undefined
            ? { isPrimary: Boolean(body.isPrimary) }
            : {}),
    };

    if (!Object.keys(data).length) {
        return badRequest(res, "Nothing to update");
    }

    try {
        const result = await patchGarageCar(userId, Array.isArray(id) ? id[0] : id, data);

        if (!result.success) {
            return badRequest(res, result.error);
        }

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteGarageCar: RequestHandler = async (
    req: AuthedRequest,
    res
) => {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const result = await removeGarageCar(userId, Array.isArray(id) ? id[0] : id);

        if (!result.success) {
            return badRequest(res, result.error);
        }

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};