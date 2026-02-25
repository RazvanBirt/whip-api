import type { RequestHandler } from "express";
import { Guard } from "../../utils/Guard";
import { badRequest, serverError, success, unauthorized } from "../../utils/https";

import {
    changePassword,
    forgotPassword,
    loginUser,
    logoutUser,
    refreshAuth,
    registerUser,
    resetPassword,
} from "./auth.service";

import type { AuthedRequest } from "./auth.middleware";

// Reuse your shared helper instead of res.status(...) here
// TODO: maybe add to Guard.ts instead of keeping it here
const guardFail = (res: any, argumentName?: string) =>
    badRequest(res, "Missing required field", { field: argumentName });

export const register: RequestHandler = async (req: any, res: any) => {
    const { UserName, Email, Password } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        // { argument: UserName, argumentName: "UserName" },
        { argument: Email, argumentName: "Email" },
        { argument: Password, argumentName: "Password" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await registerUser(UserName, Email, Password);
        if (!result.success) return badRequest(res, result.error ?? "Bad request");

        return success(res, {
            success: result.success,
            user: result.user,
            accessToken: (result as any).accessToken ?? (result as any).token,
            refreshToken: (result as any).refreshToken,
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const login: RequestHandler = async (req: any, res: any) => {
    const { Email, Password } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: Email, argumentName: "Email" },
        { argument: Password, argumentName: "Password" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await loginUser(Email, Password);
        if (!result.success) return badRequest(res, result.error ?? "Invalid credentials");

        return success(res, {
            success: result.success,
            user: result.user,
            accessToken: (result as any).accessToken ?? (result as any).token,
            refreshToken: (result as any).refreshToken,
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const refresh: RequestHandler = async (req: any, res: any) => {
    const { refreshToken } = req.body;

    const guard = Guard.againstNullOrUndefined(refreshToken, "refreshToken");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await refreshAuth(refreshToken);
        if (!result.success) return unauthorized(res, result.error ?? "Invalid refresh token");

        return success(res, {
            success: result.success,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const logout: RequestHandler = async (req: any, res: any) => {
    const { refreshToken } = req.body;

    const guard = Guard.againstNullOrUndefined(refreshToken, "refreshToken");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        await logoutUser(refreshToken);
        return success(res, { success: true }); // or success(res, null)
    } catch (err) {
        return serverError(res, err);
    }
};

export const forgotPasswordController: RequestHandler = async (req: any, res: any) => {
    const { email } = req.body;

    const guard = Guard.againstNullOrUndefined(email, "email");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        await forgotPassword(email);
        return success(res, { success: true });
    } catch (err) {
        return serverError(res, err);
    }
};

export const resetPasswordController: RequestHandler = async (req: any, res: any) => {
    const { token, newPassword } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: token, argumentName: "token" },
        { argument: newPassword, argumentName: "newPassword" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await resetPassword(token, newPassword);
        if (!result.success) return badRequest(res, result.error ?? "Invalid or expired token");

        return success(res, { success: true });
    } catch (err) {
        return serverError(res, err);
    }
};

export const changePasswordController: RequestHandler = async (req: AuthedRequest, res: any) => {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) return unauthorized(res);

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: currentPassword, argumentName: "currentPassword" },
        { argument: newPassword, argumentName: "newPassword" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await changePassword(req.user.id, currentPassword, newPassword);
        if (!result.success) return badRequest(res, result.error ?? "Could not change password");

        return success(res, { success: true });
    } catch (err) {
        return serverError(res, err);
    }
};
