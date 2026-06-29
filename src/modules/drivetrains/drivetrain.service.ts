import { prisma } from "../../config/prisma";

export const create = async (drivetrains: { type?: string | null; description?: string | null }[]) => {
    if (!drivetrains.length)
        return { success: false as const, error: "No drivetrains provided" };

    const created = await prisma.drivetrain.createMany({
        data: drivetrains.map((d) => ({
            type: d.type ?? null,
            description: d.description ?? null,
        })),
    });

    return { success: true as const, createdCount: created.count };
};

export const update = async (id: string, data: { type?: string | null; description?: string | null }) => {
    try {
        const drivetrain = await prisma.drivetrain.update({
            where: { id },
            data,
        });

        return { success: true as const, drivetrain };
    } catch {
        return { success: false as const, error: "Drivetrain not found" };
    }
};

export const removeMany = async (ids: string[]) => {
    if (!ids.length) return { success: false as const, error: "Provide ids to delete" };

    const result = await prisma.drivetrain.deleteMany({
        where: { id: { in: ids } },
    });

    return { success: true as const, deletedCount: result.count };
};

export const getAll = async (search?: string) => {
    const drivetrains = await prisma.drivetrain.findMany({
        where: search
            ? {
                OR: [
                    { type: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            }
            : undefined,
    });

    return { success: true as const, drivetrains };
};

export const getById = async (id: string) => {
    const drivetrain = await prisma.drivetrain.findUnique({ where: { id } });
    if (!drivetrain) return { success: false as const, error: "Drivetrain not found" };
    return { success: true as const, drivetrain };
};
