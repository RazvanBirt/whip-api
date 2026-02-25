import { prisma } from "../../config/prisma";

type SortOrder = "asc" | "desc";

export const create = async (
    bodyTypes: { name: string; country: string }[]
) => {
    if (!bodyTypes.length) {
        return { success: false as const, error: "No body types provided" }
    }

    const names = [...new Set(bodyTypes.map((m) => m.name))];

    const existing = await prisma.bodyType.findMany({
        where: { name: { in: names } },
        select: { id: true, name: true },
    });

    const existingNames = new Set(existing.map((m) => m.name));
    const toCreate = bodyTypes.filter((m) => !existingNames.has(m.name));

    await prisma.bodyType.createMany({
        data: toCreate,
        skipDuplicates: true,
    });

    const created = await prisma.bodyType.findMany({
        where: { name: { in: toCreate.map((m) => m.name) } },
        select: { id: true, name: true },
    });

    return {
        success: true as const,
        created,
        skipped: existing,
    };
};

export const getAll = async (opts: {
    search?: string;
    page: number;
    limit: number;
    sortField?: "name" | "country"; // whitelist fields you allow
    sortOrder?: SortOrder;
}) => {
    const { search, page, limit } = opts;

    const sortField = opts.sortField ?? "name";
    const sortOrder: SortOrder = opts.sortOrder ?? "asc";

    const where = search
        ? {
            name: { contains: search, mode: "insensitive" as const },
        }
        : undefined;

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;

    const skip = (safePage - 1) * safeLimit;
    const take = safeLimit;

    const [total, bodyTypes] = await Promise.all([
        prisma.bodyType.count({ where }),
        prisma.bodyType.findMany({
            where,
            orderBy: { [sortField]: sortOrder },
            skip,
            take,
        }),
    ]);

    return {
        success: true as const,
        bodyTypes,
        total,
        page: safePage,
        limit: safeLimit,
    };
};

export const getById = async (id: string) => {
    const bodyType = await prisma.bodyType.findUnique({
        where: { id },
    });

    if (!bodyType) {
        return {
            success: false as const,
            error: "BodyType not found",
        };
    }

    return {
        success: true as const,
        bodyType,
    };
};

export const update = async (id: string, data: { name?: string; country?: string | null; imageURL?: string; imagePath?: string }) => {
    if (data.name) {
        const existing = await prisma.bodyType.findUnique({ where: { name: data.name } });
        if (existing && existing.id !== id) {
            return { success: false as const, error: "BodyType name already exists" };
        }
    }

    try {
        const bodyType = await prisma.bodyType.update({
            where: { id },
            data,
        });

        return { success: true as const, bodyType };
    } catch (e) {
        return { success: false as const, error: "BodyType not found" };
    }
};

export const remove = async (ids: string[]) => {
    if (!ids.length) {
        return { success: false as const, error: "Provide ids to delete" };
    }

    const result = await prisma.bodyType.deleteMany({
        where: { id: { in: ids } },
    });

    return { success: true as const, deletedCount: result.count };
};
