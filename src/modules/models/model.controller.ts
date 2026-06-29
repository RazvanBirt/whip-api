import type { RequestHandler, Response } from "express";
import type { Prisma } from "../../../generated/prisma-client/client";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success } from "../../utils/https";

import { prisma } from "../../config/prisma";

import {
    create,
    update,
    removeMany,
    getAll,
    getById
} from "./model.service";

const guardFail = (res: Response, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

export const createModel: RequestHandler = async (req, res) => {
    const body = req.body;

    const items = Array.isArray(body) ? body : [body];

    // Validate required fields for each item
    for (let i = 0; i < items.length; i++) {
        const guard = Guard.againstNullOrUndefinedBulk([
            { argument: items[i]?.makeId, argumentName: `makeId[${i}]` },
            { argument: items[i]?.name, argumentName: `name[${i}]` },
        ]);
        if (!guard.succeeded) return guardFail(res, guard.argumentName);
    }

    const payload = items.map((x) => ({
        makeId: x.makeId,
        name: x.name,
        bodyStyle: x.bodyStyle ?? null,
    }));

    try {
        const result = await create(payload);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const updateModel: RequestHandler<{ id: string }> = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    const guard = Guard.againstNullOrUndefined(id, "id");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    const name = body?.name;
    const bodyStyle = body?.bodyStyle;

    if (name === undefined && bodyStyle === undefined) {
        return badRequest(res, "Missing required field", { field: "name or bodyStyle" });
    }

    try {
        const result = await update(id, {
            ...(name !== undefined ? { name } : {}),
            ...(bodyStyle !== undefined ? { bodyStyle } : {}),
        });

        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const deleteModels: RequestHandler = async (req, res) => {
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

    if (!ids.length) {
        return badRequest(res, "Missing required field", { field: "id(s)" });
    }

    try {
        const result = await removeMany(ids);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");
        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getModels: RequestHandler = async (req, res) => {
    const makeId = typeof req.query.makeId === "string" ? req.query.makeId : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const includeCatalog = req.query.includeCatalog === "true";

    try {
        const result = await getAll({
            makeId,
            search,
            page,
            limit,
            includeCatalog
        });

        return success(res, result);
    } catch (err) {
        return serverError(res, err);
    }
};

export const getModel: RequestHandler<{ id: string }> = async (req, res) => {
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

type MakeInput = {
    id?: string;
    name?: string;
    country?: string;
    imageURL?: string | null;
    imagePath?: string | null;
};

type ModelInput = { id?: string; name?: string };
type PhaseInput = { id?: string; name?: string; startYear?: number | null; endYear?: number | null };
type EngineInput = {
    id?: string;
    code?: string;
    configuration?: string | null;
    displacementLiters?: number | null;
    displacementCc?: number | null;
    cylinders?: number | null;
    fuelType?: string | null;
    aspiration?: string | null;
    powerPs?: number | null;
    powerKw?: number | null;
    torqueNm?: number | null;
    torqueLbft?: number | null;
};
type TransmissionInput = { id?: string; type?: string; gears?: number };
type DrivetrainInput = { id?: string; type?: string; description?: string | null };
type SpecInput = {
    fuelType?: string | null;
    powerPsOverride?: number | null;
    powerKwOverride?: number | null;
    torqueNmOverride?: number | null;
    torqueLbftOverride?: number | null;
    topSpeedKmh?: number | null;
    zeroTo100?: number | null;
    lengthMm?: number | null;
    widthMm?: number | null;
    heightMm?: number | null;
    wheelbaseMm?: number | null;
    curbWeightKg?: number | null;
    trunkLiters?: number | null;
    data?: Prisma.InputJsonValue;
};
type ConfigInput = {
    id?: string;
    year?: number;
    engine?: EngineInput;
    transmission?: TransmissionInput;
    drivetrain?: DrivetrainInput;
    spec?: SpecInput;
};
type VersionInput = {
    id?: string;
    name?: string;
    phaseName?: string;
    phaseId?: string | null;
    startYear?: number | null;
    endYear?: number | null;
    configs?: ConfigInput[];
};
type BodyVariantInput = {
    id?: string;
    name?: string;
    bodyType?: { name?: string };
    doors?: number;
    wheelbaseMm?: number | null;
    notes?: string | null;
    versions?: VersionInput[];
};
type GenerationInput = {
    id?: string;
    name?: string;
    startYear?: number;
    endYear?: number | null;
    phases?: PhaseInput[];
    bodyVariants?: BodyVariantInput[];
};
type CatalogInput = {
    make: MakeInput;
    model: ModelInput;
    generations?: GenerationInput[];
};

export const upsertFullModelCatalog: RequestHandler = async (req, res) => {
    const input = req.body as CatalogInput;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1) MAKE
            const make = await upsertMake(tx, input.make);

            // 2) MODEL (unique: [makeId, name])
            const model = await upsertModel(tx, make.id, input.model);

            // 3) Generations tree
            for (const genIn of input.generations ?? []) {
                const generation = await upsertGeneration(tx, model.id, genIn);

                // Phases
                const phasesByKey = new Map<string, string>(); // "Phase 1" -> id
                for (const phIn of genIn.phases ?? []) {
                    const phase = await upsertPhase(tx, generation.id, phIn);
                    phasesByKey.set(phase.name, phase.id);
                }

                // Body variants
                for (const bvIn of genIn.bodyVariants ?? []) {
                    const bodyVariant = await upsertBodyVariant(tx, generation.id, bvIn);

                    // Versions
                    for (const vIn of bvIn.versions ?? []) {
                        const phaseId =
                            vIn.phaseName ? phasesByKey.get(vIn.phaseName) ?? null : (vIn.phaseId ?? null);

                        const version = await upsertVersion(tx, bodyVariant.id, phaseId, vIn);

                        // Configs
                        for (const cfgIn of vIn.configs ?? []) {
                            const engineId = await resolveEngineId(tx, cfgIn.engine);
                            const transmissionId = await resolveTransmissionId(tx, cfgIn.transmission);
                            const drivetrainId = await resolveDrivetrainId(tx, cfgIn.drivetrain);

                            const config = await upsertVersionConfig(tx, version.id, {
                                id: cfgIn.id,
                                year: cfgIn.year ?? null,
                                engineId,
                                transmissionId,
                                drivetrainId,
                            });

                            if (cfgIn.spec) {
                                await upsertSpecSheet(tx, config.id, cfgIn.spec);
                            }
                        }
                    }
                }
            }

            return model;
        });

        return res.status(200).json({ model: result });
    } catch (e: unknown) {
        console.error(e);
        const details = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ error: "Upsert catalog tree failed", details });
    }
};

// ---------------- UPSERT HELPERS ----------------

async function upsertMake(tx: Prisma.TransactionClient, makeIn: MakeInput) {
    // supports: { id } OR { name, ... }
    if (makeIn?.id) {
        return tx.make.update({
            where: { id: makeIn.id },
            data: stripUndefined({
                name: makeIn.name,
                country: makeIn.country,
                imageURL: makeIn.imageURL,
                imagePath: makeIn.imagePath,
            }),
        });
    }

    if (!makeIn?.name) throw new Error("make.name is required");
    if (!makeIn.country) throw new Error("make.country is required");

    return tx.make.upsert({
        where: { name: makeIn.name },
        update: stripUndefined({
            country: makeIn.country,
            imageURL: makeIn.imageURL,
            imagePath: makeIn.imagePath,
        }),
        create: {
            name: makeIn.name,
            country: makeIn.country,
            imageURL: makeIn.imageURL ?? null,
            imagePath: makeIn.imagePath ?? null,
        },
    });
}

async function upsertModel(tx: Prisma.TransactionClient, makeId: string, modelIn: ModelInput) {
    // unique is @@unique([makeId, name])
    if (modelIn?.id) {
        return tx.model.update({
            where: { id: modelIn.id },
            data: stripUndefined({
                name: modelIn.name,
                makeId, // keep consistent
            }),
        });
    }

    if (!modelIn?.name) throw new Error("model.name is required");

    return tx.model.upsert({
        where: { makeId_name: { makeId, name: modelIn.name } },
        update: {},
        create: { makeId, name: modelIn.name },
    });
}

async function upsertGeneration(tx: Prisma.TransactionClient, modelId: string, genIn: GenerationInput) {
    if (genIn?.id) {
        return tx.generation.update({
            where: { id: genIn.id },
            data: stripUndefined({
                name: genIn.name,
                startYear: genIn.startYear,
                endYear: genIn.endYear,
                modelId,
            }),
        });
    }

    if (!genIn?.name) throw new Error("generation.name is required");
    if (genIn.startYear === undefined) throw new Error("generation.startYear is required");

    return tx.generation.upsert({
        where: { modelId_name: { modelId, name: genIn.name } },
        update: stripUndefined({
            startYear: genIn.startYear,
            endYear: genIn.endYear,
        }),
        create: {
            modelId,
            name: genIn.name,
            startYear: genIn.startYear,
            endYear: genIn.endYear ?? null,
        },
    });
}

async function upsertPhase(tx: Prisma.TransactionClient, generationId: string, phIn: PhaseInput) {
    if (phIn?.id) {
        return tx.phase.update({
            where: { id: phIn.id },
            data: stripUndefined({
                name: phIn.name,
                startYear: phIn.startYear,
                endYear: phIn.endYear,
                generationId,
            }),
        });
    }

    if (!phIn?.name) throw new Error("phase.name is required");

    return tx.phase.upsert({
        where: { generationId_name: { generationId, name: phIn.name } },
        update: stripUndefined({
            startYear: phIn.startYear,
            endYear: phIn.endYear,
        }),
        create: {
            generationId,
            name: phIn.name,
            startYear: phIn.startYear ?? null,
            endYear: phIn.endYear ?? null,
        },
    });
}

async function upsertBodyVariant(tx: Prisma.TransactionClient, generationId: string, bvIn: BodyVariantInput) {
    // needs bodyTypeId, we upsert bodytype by name
    const bodyTypeName = bvIn.bodyType?.name;
    if (!bodyTypeName) throw new Error("bodyVariant.bodyType.name is required");

    const bt = await tx.bodyType.upsert({
        where: { name: bodyTypeName },
        update: {},
        create: { name: bodyTypeName },
    });

    if (bvIn?.id) {
        return tx.bodyVariant.update({
            where: { id: bvIn.id },
            data: stripUndefined({
                generationId,
                bodyTypeId: bt.id,
                name: bvIn.name,
                doors: bvIn.doors,
                wheelbaseMm: bvIn.wheelbaseMm,
                notes: bvIn.notes,
            }),
        });
    }

    if (!bvIn?.name) throw new Error("bodyVariant.name is required");
    if (bvIn.doors === undefined) throw new Error("bodyVariant.doors is required");
    // unique: @@unique([generationId, bodyTypeId, name])
    return tx.bodyVariant.upsert({
        where: {
            generationId_bodyTypeId_name: { generationId, bodyTypeId: bt.id, name: bvIn.name },
        },
        update: stripUndefined({
            doors: bvIn.doors,
            wheelbaseMm: bvIn.wheelbaseMm,
            notes: bvIn.notes,
        }),
        create: {
            generationId,
            bodyTypeId: bt.id,
            name: bvIn.name,
            doors: bvIn.doors,
            wheelbaseMm: bvIn.wheelbaseMm ?? null,
            notes: bvIn.notes ?? null,
        },
    });
}

async function upsertVersion(tx: Prisma.TransactionClient, bodyVariantId: string, phaseId: string | null, vIn: VersionInput) {
    if (vIn?.id) {
        return tx.version.update({
            where: { id: vIn.id },
            data: stripUndefined({
                bodyVariantId,
                phaseId,
                name: vIn.name,
                startYear: vIn.startYear,
                endYear: vIn.endYear,
            }),
        });
    }

    if (!vIn?.name) throw new Error("version.name is required");

    const existing = await tx.version.findFirst({
        where: { bodyVariantId, phaseId, name: vIn.name },
    });

    if (existing) {
        return tx.version.update({
            where: { id: existing.id },
            data: stripUndefined({
                startYear: vIn.startYear,
                endYear: vIn.endYear,
            }),
        });
    }

    return tx.version.create({
        data: {
            bodyVariantId,
            phaseId,
            name: vIn.name,
            startYear: vIn.startYear,
            endYear: vIn.endYear,
        },
    });
}

async function upsertVersionConfig(
    tx: Prisma.TransactionClient,
    versionId: string,
    cfg: { id?: string; year: number | null; engineId: string | null; transmissionId: string | null; drivetrainId: string | null }
) {
    if (cfg.year === null) throw new Error("version config year is required");

    if (cfg.id) {
        return tx.versionConfig.update({
            where: { id: cfg.id },
            data: {
                versionId,
                year: cfg.year,
                engineId: cfg.engineId,
                transmissionId: cfg.transmissionId,
                drivetrainId: cfg.drivetrainId,
            },
        });
    }

    const existing = await tx.versionConfig.findFirst({
        where: {
            versionId,
            year: cfg.year,
            engineId: cfg.engineId,
            transmissionId: cfg.transmissionId,
            drivetrainId: cfg.drivetrainId,
        },
    });

    if (existing) return existing;

    return tx.versionConfig.create({
        data: {
            versionId,
            year: cfg.year,
            engineId: cfg.engineId,
            transmissionId: cfg.transmissionId,
            drivetrainId: cfg.drivetrainId,
        },
    });
}

async function upsertSpecSheet(tx: Prisma.TransactionClient, versionConfigId: string, specIn: SpecInput) {
    // SpecSheet unique is versionConfigId
    return tx.specSheet.upsert({
        where: { versionConfigId },
        update: stripUndefined({
            fuelType: specIn.fuelType,
            powerPsOverride: specIn.powerPsOverride,
            powerKwOverride: specIn.powerKwOverride,
            torqueNmOverride: specIn.torqueNmOverride,
            torqueLbftOverride: specIn.torqueLbftOverride,
            topSpeedKmh: specIn.topSpeedKmh,
            zeroTo100: specIn.zeroTo100,
            lengthMm: specIn.lengthMm,
            widthMm: specIn.widthMm,
            heightMm: specIn.heightMm,
            wheelbaseMm: specIn.wheelbaseMm,
            curbWeightKg: specIn.curbWeightKg,
            trunkLiters: specIn.trunkLiters,
            data: specIn.data,
        }),
        create: {
            versionConfigId,
            fuelType: specIn.fuelType ?? null,
            powerPsOverride: specIn.powerPsOverride ?? null,
            powerKwOverride: specIn.powerKwOverride ?? null,
            torqueNmOverride: specIn.torqueNmOverride ?? null,
            torqueLbftOverride: specIn.torqueLbftOverride ?? null,
            topSpeedKmh: specIn.topSpeedKmh ?? null,
            zeroTo100: specIn.zeroTo100 ?? null,
            lengthMm: specIn.lengthMm ?? null,
            widthMm: specIn.widthMm ?? null,
            heightMm: specIn.heightMm ?? null,
            wheelbaseMm: specIn.wheelbaseMm ?? null,
            curbWeightKg: specIn.curbWeightKg ?? null,
            trunkLiters: specIn.trunkLiters ?? null,
            data: specIn.data ?? undefined,
        },
    });
}

// ---------- resolves for catalog tables ----------

async function resolveEngineId(tx: Prisma.TransactionClient, engineIn?: EngineInput) {
    if (!engineIn) return null;
    if (engineIn.id) return engineIn.id;
    if (engineIn.code) {
        const e = await tx.engine.upsert({
            where: { code: engineIn.code },
            update: stripUndefined({
                configuration: engineIn.configuration,
                displacementLiters: engineIn.displacementLiters,
                displacementCc: engineIn.displacementCc,
                cylinders: engineIn.cylinders,
                fuelType: engineIn.fuelType,
                aspiration: engineIn.aspiration,
                powerPs: engineIn.powerPs,
                powerKw: engineIn.powerKw,
                torqueNm: engineIn.torqueNm,
                torqueLbft: engineIn.torqueLbft,
            }),
            create: {
                code: engineIn.code,
                configuration: engineIn.configuration ?? null,
                displacementLiters: engineIn.displacementLiters ?? null,
                displacementCc: engineIn.displacementCc ?? null,
                cylinders: engineIn.cylinders ?? null,
                fuelType: engineIn.fuelType ?? null,
                aspiration: engineIn.aspiration ?? null,
                powerPs: engineIn.powerPs ?? null,
                powerKw: engineIn.powerKw ?? null,
                torqueNm: engineIn.torqueNm ?? null,
                torqueLbft: engineIn.torqueLbft ?? null,
            },
        });
        return e.id;
    }
    return null;
}

async function resolveTransmissionId(tx: Prisma.TransactionClient, tIn?: TransmissionInput) {
    if (!tIn) return null;
    if (tIn.id) return tIn.id;
    if (!tIn.type || tIn.gears === undefined) {
        throw new Error("transmission.type and transmission.gears are required");
    }

    // If you add @@unique([type, gears]) you can upsert here.
    const t = await tx.transmission.create({
        data: { type: tIn.type, gears: tIn.gears },
    });
    return t.id;
}

async function resolveDrivetrainId(tx: Prisma.TransactionClient, dIn?: DrivetrainInput) {
    if (!dIn) return null;
    if (dIn.id) return dIn.id;
    if (!dIn.type) throw new Error("drivetrain.type is required");

    // If you add @@unique([type, description]) you can upsert here.
    const d = await tx.drivetrain.create({
        data: { type: dIn.type, description: dIn.description ?? null },
    });
    return d.id;
}

// util: Prisma hates undefined in data
function stripUndefined<T extends object>(obj: T): T {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as T;
}
