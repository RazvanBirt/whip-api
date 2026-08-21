import { prisma } from "../../config/prisma";

export type UserTheme = {
    darkTheme: boolean;
    primary: string;
    surface: string | null;
    preset: string;
};

const DEFAULT_THEME: UserTheme = {
    darkTheme: false,
    primary: "noir",
    surface: null,
    preset: "Aura",
};

export async function findUserTheme(userId: string) {
    const setting = await prisma.userSetting.findUnique({
        where: {
            userId_settingKey: {
                userId,
                settingKey: "theme",
            },
        },
    });

    return {
        success: true as const,
        theme: setting?.settingValue
            ? (setting.settingValue as UserTheme)
            : DEFAULT_THEME,
    };
}

export async function saveUserTheme(
    userId: string,
    theme: UserTheme
) {
    const settingValue = {
        darkTheme: theme.darkTheme,
        primary: theme.primary,
        surface: theme.surface,
        preset: theme.preset,
    };

    const setting = await prisma.userSetting.upsert({
        where: {
            userId_settingKey: {
                userId,
                settingKey: "theme",
            },
        },
        update: {
            settingValue,
            updatedAt: new Date(),
        },
        create: {
            userId,
            settingKey: "theme",
            settingValue,
        },
    });

    return {
        success: true as const,
        theme: setting.settingValue as UserTheme,
    };
}