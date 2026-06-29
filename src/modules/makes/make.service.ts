import { prisma } from "../../config/prisma";

type SortOrder = "asc" | "desc";

export const create = async (
  makes: { name: string; country: string }[]
) => {
  if (!makes.length) {
    return { success: false as const, error: "No makes provided" }
  }

  const names = [...new Set(makes.map((m) => m.name))];

  const existing = await prisma.make.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, country: true },
  });

  const existingNames = new Set(existing.map((m) => m.name));
  const toCreate = makes.filter((m) => !existingNames.has(m.name));

  await prisma.make.createMany({
    data: toCreate,
    skipDuplicates: true,
  });

  const created = await prisma.make.findMany({
    where: { name: { in: toCreate.map((m) => m.name) } },
    select: { id: true, name: true, country: true },
  });

  return {
    success: true as const,
    created,
    skipped: existing,
  };
};

export const createOne = async (make: { name: string; country: string }) => {
  const existing = await prisma.make.findUnique({
    where: { name: make.name },
    select: { id: true, name: true, country: true, imageURL: true },
  });

  if (existing) {
    return { success: false as const, error: "Make already exists", existing };
  }

  const created = await prisma.make.create({
    data: { name: make.name, country: make.country },
    select: { id: true, name: true, country: true, imageURL: true },
  });

  return { success: true as const, created };
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

  const [total, makes] = await Promise.all([
    prisma.make.count({ where }),
    prisma.make.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take,
    }),
  ]);

  return {
    success: true as const,
    makes,
    total,
    page: safePage,
    limit: safeLimit,
  };
};

export const getById = async (id: string) => {
  const make = await prisma.make.findUnique({
    where: { id },
  });

  if (!make) {
    return {
      success: false as const,
      error: "Make not found",
    };
  }

  return {
    success: true as const,
    make,
  };
};

export const update = async (id: string, data: { name?: string; country?: string | null; imageURL?: string; imagePath?: string }) => {
  if (data.name) {
    const existing = await prisma.make.findUnique({ where: { name: data.name } });
    if (existing && existing.id !== id) {
      return { success: false as const, error: "Make name already exists" };
    }
  }

  try {
    const make = await prisma.make.update({
      where: { id },
      data,
    });

    return { success: true as const, make };
  } catch {
    return { success: false as const, error: "Make not found" };
  }
};

export const remove = async (ids: string[]) => {
  if (!ids.length) {
    return { success: false as const, error: "Provide ids to delete" };
  }

  const result = await prisma.make.deleteMany({
    where: { id: { in: ids } },
  });

  return { success: true as const, deletedCount: result.count };
};
