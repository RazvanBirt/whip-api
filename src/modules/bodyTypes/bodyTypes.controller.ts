import type { RequestHandler } from "express";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success, unauthorized } from "../../utils/https";
import { supabaseAdmin } from "../../lib/supabase"; // service role client

import { prisma } from "../../config/prisma";

import {
    create,
    getAll,
    getById,
    update,
    remove
} from "./bodyTypes.service";

const guardFail = (res: any, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

const BUCKET = process.env.SUPABASE_BUCKET || 'whip_images'

export const createBodyType: RequestHandler = async (req: any, res: any) => {
    const body = req.body;
    console.log('createMake body:', body);
    // Accept single object or array
    const items = Array.isArray(body) ? body : [body];

    // basic body check
    const guard = Guard.againstNullOrUndefined(items, "Body");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    // validate each item has name + country (same rule you had)
    for (let i = 0; i < items.length; i++) {
        const guard = Guard.againstNullOrUndefinedBulk([
            { argument: items[i]?.name, argumentName: `Name[${i}]` },
            { argument: items[i]?.country, argumentName: `Country[${i}]` },
        ]);
        if (!guard.succeeded) return guardFail(res, guard.argumentName);
    }

    try {
        const payload = items.map((x: any) => {
            return {
                name: x.name,
                country: x.country,
            };
        });
        const result = await create(payload);

        if (!result.success) return badRequest(res, result.error ?? "Bad request");

        // return what you actually created (and skipped)
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getBodyTypes: RequestHandler = async (req: any, res: any) => {
    const search =
        typeof req.query.search === "string" ? req.query.search : undefined;

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const sortField = typeof req.query.sortField === "string" ? req.query.sortField : "name";
    const sortOrder = String(req.query.sortOrder ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";


    try {
        const result = await getAll({ search, page, limit, sortField, sortOrder });
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getBodyType: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await getById(id);
        if (!result.success)
            return badRequest(res, result.error ?? "Bad request");

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateBodyType: RequestHandler = async (req: any, res: any) => {
    const { id } = req.params;
    const body = req.body;
    const file = req.file as Express.Multer.File | undefined;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    const name = body?.name;
    const country = body?.country;

    if (name === undefined && country === undefined && !file) {
        return badRequest(res, "Nothing to update", { field: "name, country, or image" });
    }

    if (file && !file.mimetype.startsWith("image/")) {
        return badRequest(res, "Only image files are allowed");
    }

    try {

        let newImagePath: string | undefined;
        let newImageUrl: string | undefined;

        if (file) {
            const existing = await prisma.make.findUnique({
                where: { id },
                select: { imagePath: true },
            });

            const oldPath = existing?.imagePath;

            if (oldPath) {
                const { error: removeError } = await supabaseAdmin.storage
                    .from(BUCKET)
                    .remove([oldPath]);

                if (removeError) {
                    console.warn("Supabase remove failed:", removeError.message);
                    return serverError(res, removeError);
                }
            }

            const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
            newImagePath = `makes/${id}-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabaseAdmin.storage
                .from(BUCKET)
                .upload(newImagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false, // unique timestamp names
                });

            if (uploadError) {
                return serverError(res, uploadError);
            }
            const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(newImagePath);
            newImageUrl = data.publicUrl;
        }

        const result = await update(id, {
            ...(name !== undefined ? { name } : {}),
            ...(country !== undefined ? { country } : {}),
            ...(newImageUrl !== undefined ? { imageURL: newImageUrl } : {}),
            ...(newImagePath !== undefined ? { imagePath: newImagePath } : {}),
        });

        if (!result.success) return badRequest(res, result.error ?? "Bad request");

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteBodyTypes: RequestHandler = async (req: any, res: any) => {
    const body = req.body;

    let ids: string[] = [];

    if (Array.isArray(body)) {
        // array of ids or { id }
        for (const item of body) {
            if (typeof item === "string") ids.push(item);
            else if (item?.id) ids.push(item.id);
        }
    } else {
        // { ids: [] } or { id: "" }
        if (Array.isArray(body?.ids)) ids = body.ids;
        if (body?.id) ids.push(body.id);
    }

    if (!ids.length) {
        return badRequest(res, "Missing required field", { field: "id(s)" });
    }

    try {

        const makes = await prisma.make.findMany({
            where: { id: { in: ids } },
            select: { id: true, imagePath: true },
        });

        const paths = makes
            .map(m => m.imagePath)
            .filter((p): p is string => !!p);

        if (paths.length) {
            const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
            if (error) return serverError(res, error);
        }

        const result = await remove(ids);

        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

