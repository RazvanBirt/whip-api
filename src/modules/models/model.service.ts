import { prisma } from "../../config/prisma";
import type { Prisma } from "../../../generated/prisma-client/client";

export const create = async (
    //TODO: correct this service
    models: { makeId: string; name: string; bodyStyle?: string | null }[]
) => {
    if (!models.length) {
        return { success: false as const, error: "No models provided" };
    }

    // find existing based on @@unique([makeId, name, bodyStyle])
    // IMPORTANT: bodyStyle can be null, Prisma equality handles null fine.
    const existing = await prisma.model.findMany({
        where: {
            OR: models.map((m) => ({
                makeId: m.makeId,
                name: m.name,
                bodyStyle: m.bodyStyle ?? null,
            })),
        },
        select: { id: true, makeId: true, name: true, bodyStyle: true },
    });

    const existsKey = new Set(
        existing.map((e) => `${e.makeId}::${e.name}::${e.bodyStyle ?? ""}`)
    );

    const toCreate = models
        .map((m) => ({
            makeId: m.makeId,
            name: m.name,
            bodyStyle: m.bodyStyle ?? null,
        }))
        .filter((m) => !existsKey.has(`${m.makeId}::${m.name}::${m.bodyStyle ?? ""}`));

    if (!toCreate.length) {
        return { success: true as const, created: [], skipped: existing };
    }

    await prisma.model.createMany({
        data: toCreate,
        skipDuplicates: true,
    });

    const created = await prisma.model.findMany({
        where: {
            OR: toCreate.map((m) => ({
                makeId: m.makeId,
                name: m.name,
                bodyStyle: m.bodyStyle ?? null,
            })),
        },
        select: { id: true, makeId: true, name: true, bodyStyle: true },
        orderBy: [{ name: "asc" }],
    });

    return { success: true as const, created, skipped: existing };
};

export const update = async (
    id: string,
    data: { name?: string; bodyStyle?: string | null }
) => {
    try {
        const model = await prisma.model.update({
            where: { id },
            data,
        });

        return { success: true as const, model };
    } catch {
        return { success: false as const, error: "Model not found" };
    }
};

export const removeMany = async (ids: string[]) => {
    if (!ids.length) {
        return { success: false as const, error: "Provide ids to delete" };
    }

    const result = await prisma.model.deleteMany({
        where: { id: { in: ids } },
    });

    return { success: true as const, deletedCount: result.count };
};

export const getAll = async (params?: {
    makeId?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeCatalog?: boolean;
}) => {
    const {
        makeId,
        search,
        page = 1,
        limit = 10,
        includeCatalog = false
    } = params || {};

    const skip = (page - 1) * limit;

    const where: Prisma.ModelWhereInput = {
        ...(makeId ? { makeId } : {}),
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    {
                        make: {
                            name: { contains: search, mode: "insensitive" }
                        }
                    }
                ]
            }
            : {})
    };

    const [models, total] = await Promise.all([
        prisma.model.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
            include: includeCatalog
                ? {
                    make: true,
                    generations: {
                        include: {
                            phases: true,
                            bodyVariants: {
                                include: {
                                    bodyType: true,
                                    versions: {
                                        include: {
                                            configs: {
                                                include: {
                                                    engine: true,
                                                    transmission: true,
                                                    drivetrain: true,
                                                    spec: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                : {
                    make: true
                }
        }),
        prisma.model.count({ where })
    ]);

    return {
        success: true as const,
        models,
        total,
        page,
        limit
    };
};

export const getById = async (id: string) => {
    const model = await prisma.model.findUnique({
        where: { id },
        include: {
            make: true,
            generations: {
                include: {
                    phases: true,
                    bodyVariants: {
                        include: {
                            bodyType: true,
                            versions: {
                                include: {
                                    phase: true,
                                    configs: {
                                        include: {
                                            engine: true,
                                            transmission: true,
                                            drivetrain: true,
                                            spec: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!model) {
        return {
            success: false as const,
            error: "Model not found",
        };
    }

    return {
        success: true as const,
        model,
    };
};
