import { prisma } from "../../config/prisma";

export const create = async (
    engines: {
        code: string;
        configuration?: string | null;
        displacementLiters?: number | null;
        displacementCc?: number | null;
        cylinders?: number | null;
        fuelType?: string | null;
        aspiration?: string | null;
        horsepower?: number | null;
        torqueNm?: number | null;
        torqueLbft?: number | null;
    }[]
) => {
    if (!engines.length) return { success: false as const, error: "No engines provided" };

    const codes = [...new Set(engines.map((e) => e.code))];

    const existing = await prisma.engine.findMany({
        where: { code: { in: codes } },
    });

    const existingCodes = new Set(existing.map((e) => e.code));
    const toCreate = engines.filter((e) => !existingCodes.has(e.code));

    if (!toCreate.length) return { success: true as const, created: [], skipped: existing };

    await prisma.engine.createMany({
        data: toCreate,
        skipDuplicates: true,
    });

    const created = await prisma.engine.findMany({
        where: { code: { in: toCreate.map((e) => e.code) } },
        orderBy: { code: "asc" },
    });

    return { success: true as const, created, skipped: existing };
};

export const update = async (
    id: string,
    data: {
        code?: string;
        configuration?: string | null;
        displacementLiters?: number | null;
        displacementCc?: number | null;
        cylinders?: number | null;
        fuelType?: string | null;
        aspiration?: string | null;
        horsepower?: number | null;
        torqueNm?: number | null;
        torqueLbft?: number | null;
    }
) => {
    // if changing code, ensure unique
    if (data.code) {
        const existing = await prisma.engine.findUnique({ where: { code: data.code } });
        if (existing && existing.id !== id) {
            return { success: false as const, error: "Engine code already exists" };
        }
    }

    try {
        const engine = await prisma.engine.update({
            where: { id },
            data,
        });

        return { success: true as const, engine };
    } catch (e) {
        return { success: false as const, error: "Engine not found" };
    }
};

export const removeMany = async (ids: string[]) => {
    if (!ids.length) return { success: false as const, error: "Provide ids to delete" };

    const result = await prisma.engine.deleteMany({
        where: { id: { in: ids } },
    });

    return { success: true as const, deletedCount: result.count };
};

export const getAll = async (search?: string) => {
    const engines = await prisma.engine.findMany({
        where: search
            ? {
                OR: [
                    { code: { contains: search, mode: "insensitive" } },
                    { configuration: { contains: search, mode: "insensitive" } },
                    { fuelType: { contains: search, mode: "insensitive" } },
                    { aspiration: { contains: search, mode: "insensitive" } },
                ],
            }
            : undefined,
        orderBy: { code: "asc" },
    });

    return { success: true as const, engines };
};

export const getById = async (id: string) => {
    const engine = await prisma.engine.findUnique({ where: { id } });
    if (!engine) return { success: false as const, error: "Engine not found" };
    return { success: true as const, engine };
};
