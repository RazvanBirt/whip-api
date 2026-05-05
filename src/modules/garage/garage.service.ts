import { prisma } from "../../config/prisma";

export const userCarInclude = {
    versionConfig: {
        include: {
            engine: true,
            transmission: true,
            drivetrain: true,
            spec: true,
            version: {
                include: {
                    phase: true,
                    bodyVariant: {
                        include: {
                            bodyType: true,
                            generation: {
                                include: {
                                    model: {
                                        include: {
                                            make: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

export async function findMyGarage(userId: string) {
    const cars = await prisma.userCar.findMany({
        where: { userId },
        include: userCarInclude,
        orderBy: { createdAt: "desc" },
    });

    return {
        success: true as const,
        cars,
    };
}

export async function findGarageCarById(userId: string, userCarId: string) {
    const car = await prisma.userCar.findFirst({
        where: {
            id: userCarId,
            userId,
        },
        include: userCarInclude,
    });

    if (!car) {
        return {
            success: false as const,
            error: "Garage car not found",
        };
    }

    return {
        success: true as const,
        car,
    };
}

export async function createGarageCar(
    userId: string,
    data: {
        versionConfigId: string;
        nickname?: string | null;
        vin?: string | null;
        licensePlate?: string | null;
        color?: string | null;
        mileageKm?: number | null;
        isPrimary?: boolean;
    }
) {
    const config = await prisma.versionConfig.findUnique({
        where: { id: data.versionConfigId },
        select: {
            id: true,
        },
    });

    if (!config) {
        return {
            success: false as const,
            error: "Selected vehicle configuration does not exist",
        };
    }

    const car = await prisma.$transaction(async (tx) => {
        if (data.isPrimary) {
            await tx.userCar.updateMany({
                where: { userId },
                data: { isPrimary: false },
            });
        }

        return tx.userCar.create({
            data: {
                userId,
                versionConfigId: config.id,
                nickname: data.nickname ?? null,
                vin: data.vin ?? null,
                licensePlate: data.licensePlate ?? null,
                color: data.color ?? null,
                mileageKm: data.mileageKm ?? null,
                isPrimary: data.isPrimary ?? false,
            },
            include: userCarInclude,
        });
    });

    return {
        success: true as const,
        car,
    };
}

export async function patchGarageCar(
    userId: string,
    userCarId: string,
    data: {
        nickname?: string | null;
        vin?: string | null;
        licensePlate?: string | null;
        color?: string | null;
        mileageKm?: number | null;
        isPrimary?: boolean;
    }
) {
    const existing = await prisma.userCar.findFirst({
        where: {
            id: userCarId,
            userId,
        },
        select: { id: true },
    });

    if (!existing) {
        return {
            success: false as const,
            error: "Garage car not found",
        };
    }

    const car = await prisma.$transaction(async (tx) => {
        if (data.isPrimary) {
            await tx.userCar.updateMany({
                where: { userId },
                data: { isPrimary: false },
            });
        }

        return tx.userCar.update({
            where: { id: userCarId },
            data,
            include: userCarInclude,
        });
    });

    return {
        success: true as const,
        car,
    };
}

export async function removeGarageCar(userId: string, userCarId: string) {
    const existing = await prisma.userCar.findFirst({
        where: {
            id: userCarId,
            userId,
        },
        select: { id: true },
    });

    if (!existing) {
        return {
            success: false as const,
            error: "Garage car not found",
        };
    }

    await prisma.userCar.delete({
        where: { id: userCarId },
    });

    return {
        success: true as const,
        deletedId: userCarId,
    };
}