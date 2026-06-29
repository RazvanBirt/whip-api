import { prisma } from "../../config/prisma";

export const create = async (
    transmissions: { type?: string | null; gears?: number | null }[]
) => {
    if (!transmissions.length)
        return { success: false as const, error: "No transmissions provided" };

    // no unique field here, so we just insert all
    const created = await prisma.transmission.createMany({
        data: transmissions.map((t) => ({
            type: t.type ?? null,
            gears: t.gears ?? null,
        })),
    });

    return { success: true as const, createdCount: created.count };
};

export const update = async (
  id: string,
  data: { type?: string | null; gears?: number | null }
) => {
  console.log("Updating transmission service:", { id, ...data });

  try {
    const transmission = await prisma.transmission.update({
      where: { id },
      data,
    });
    return { success: true as const, transmission };
  } catch (e: unknown) {
    const error = e as { code?: unknown; message?: unknown; meta?: unknown };
    console.error("Prisma update error:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });

    if (error.code === "P2025") {
      return { success: false as const, error: "Transmission not found" };
    }

    if (error.code === "P2002") {
      return {
        success: false as const,
        error: "Transmission with same type/gears already exists",
      };
    }

    return { success: false as const, error: "Update failed" };
  }
};


export const removeMany = async (ids: string[]) => {
    if (!ids.length) return { success: false as const, error: "Provide ids to delete" };

    const result = await prisma.transmission.deleteMany({
        where: { id: { in: ids } },
    });

    return { success: true as const, deletedCount: result.count };
};

export const getAll = async (search?: string) => {
    const transmissions = await prisma.transmission.findMany({
        where: search
            ? {
                OR: [
                    { type: { contains: search, mode: "insensitive" } },
                    // gears is numeric, so we won't search it unless you want parseInt behavior
                ],
            }
            : undefined,
    });

    return { success: true as const, transmissions };
};

export const getById = async (id: string) => {
    const transmission = await prisma.transmission.findUnique({ where: { id } });
    if (!transmission) return { success: false as const, error: "Transmission not found" };
    return { success: true as const, transmission };
};
