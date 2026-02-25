import { prisma } from "../../config/prisma";

export const create = async (modelId: string, year: number) => {
    // prevent duplicates @@unique([modelId, year])
    const existing = await prisma.modelYear.findFirst({
        where: { modelId, year },
    });
    if (existing) return { success: false as const, error: "Model year already exists" };

    const modelYear = await prisma.modelYear.create({
        data: { modelId, year },
    });

    return { success: true as const, modelYear };
};

export const getById = async (id: string) => {
    const modelYear = await prisma.modelYear.findUnique({
        where: { id },
        include: {
            model: true,
            modelYearEngines: { include: { engine: true } },
            modelYearTransmissions: { include: { transmission: true } },
            modelYearDrivetrains: { include: { drivetrain: true } },
        },
    });

    if (!modelYear) return { success: false as const, error: "ModelYear not found" };
    return { success: true as const, modelYear };
};

export const attachEngines = async (modelYearId: string, engineIds: string[]) => {
    if (!engineIds.length) return { success: false as const, error: "Provide ids" };

    await prisma.modelYearEngine.createMany({
        data: engineIds.map((engineId) => ({ modelYearId, engineId })),
        skipDuplicates: true,
    });

    return { success: true as const };
};

export const detachEngines = async (modelYearId: string, engineIds: string[]) => {
    if (!engineIds.length) return { success: false as const, error: "Provide ids" };

    const result = await prisma.modelYearEngine.deleteMany({
        where: { modelYearId, engineId: { in: engineIds } },
    });

    return { success: true as const, deletedCount: result.count };
};

export const attachTransmissions = async (modelYearId: string, transmissionIds: string[]) => {
    if (!transmissionIds.length) return { success: false as const, error: "Provide ids" };

    await prisma.modelYearTransmission.createMany({
        data: transmissionIds.map((transmissionId) => ({ modelYearId, transmissionId })),
        skipDuplicates: true,
    });

    return { success: true as const };
};

export const detachTransmissions = async (modelYearId: string, transmissionIds: string[]) => {
    if (!transmissionIds.length) return { success: false as const, error: "Provide ids" };

    const result = await prisma.modelYearTransmission.deleteMany({
        where: { modelYearId, transmissionId: { in: transmissionIds } },
    });

    return { success: true as const, deletedCount: result.count };
};

export const attachDrivetrains = async (modelYearId: string, drivetrainIds: string[]) => {
    if (!drivetrainIds.length) return { success: false as const, error: "Provide ids" };

    await prisma.modelYearDrivetrain.createMany({
        data: drivetrainIds.map((drivetrainId) => ({ modelYearId, drivetrainId })),
        skipDuplicates: true,
    });

    return { success: true as const };
};

export const detachDrivetrains = async (modelYearId: string, drivetrainIds: string[]) => {
    if (!drivetrainIds.length) return { success: false as const, error: "Provide ids" };

    const result = await prisma.modelYearDrivetrain.deleteMany({
        where: { modelYearId, drivetrainId: { in: drivetrainIds } },
    });

    return { success: true as const, deletedCount: result.count };
};
