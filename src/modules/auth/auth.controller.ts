import type { RequestHandler, Response } from "express";
import { Guard } from "../../utils/Guard";

import {
    badRequest,
    conflict,
    created,
    noContent,
    ok,
    serverError,
    unauthorized,
    validationError,
    notFound,
} from "../../utils/https";

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
const guardFail = (res: Response, argumentName?: string) => badRequest(res, "Missing required field", { field: argumentName });

const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isStrongPassword = (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
};

export const register: RequestHandler = async (req, res) => {
    const { UserName, Email, Password } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        //TODO: actually add username to the registration process
        // { argument: UserName, argumentName: "UserName" },
        { argument: Email, argumentName: "Email" },
        { argument: Password, argumentName: "Password" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    if (!isValidEmail(Email)) {
        return badRequest(res, "Invalid email address");
    }

    if (!isStrongPassword(Password)) {
        return badRequest(
            res,
            "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
        );
    }

    try {
        const result = await registerUser(UserName, Email, Password);
        if (!result.success) {
            if (result.error === "Email already registered") {
                return conflict(res, result.error);
            }

            return badRequest(res, result.error ?? "Bad request");
        }

        return created(res, {
            success: true,
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const login: RequestHandler = async (req, res) => {
    const { Email, Password } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: Email, argumentName: "Email" },
        { argument: Password, argumentName: "Password" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await loginUser(Email, Password);
        if (!result.success) {
            return unauthorized(res, result.error ?? "Invalid credentials");
        }

        return ok(res, {
            success: true,
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const refresh: RequestHandler = async (req, res) => {
    const { refreshToken } = req.body;

    const guard = Guard.againstNullOrUndefined(refreshToken, "refreshToken");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await refreshAuth(refreshToken);
        if (!result.success) return unauthorized(res, result.error ?? "Invalid refresh token");

        return ok(res, {
            success: result.success,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    } catch (err) {
        return serverError(res, err);
    }
};

export const logout: RequestHandler = async (req, res) => {
    const { refreshToken } = req.body;

    const guard = Guard.againstNullOrUndefined(refreshToken, "refreshToken");
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        await logoutUser(refreshToken);
        return noContent(res);
    } catch (err) {
        return serverError(res, err);
    }
};

export const forgotPasswordController: RequestHandler = async (req, res) => {
    const { Email } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: Email, argumentName: "Email" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        await forgotPassword(Email);
        return ok(res, { success: true });
    } catch (err) {
        return serverError(res, err);
    }
};

export const resetPasswordController: RequestHandler = async (req, res) => {
    const { Token, NewPassword } = req.body;

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: Token, argumentName: "Token" },
        { argument: NewPassword, argumentName: "NewPassword" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await resetPassword(Token, NewPassword);
        if (!result.success) return validationError(res, result.error ?? "Invalid or expired token");

        return ok(res, { success: true });
    } catch (err) {
        return serverError(res, err);
    }
};

export const changePasswordController: RequestHandler = async (req: AuthedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!req.user) return unauthorized(res);

    const guard = Guard.againstNullOrUndefinedBulk([
        { argument: currentPassword, argumentName: "currentPassword" },
        { argument: newPassword, argumentName: "newPassword" },
    ]);
    if (!guard.succeeded) return guardFail(res, guard.argumentName);

    try {
        const result = await changePassword(
            req.user.id,
            currentPassword,
            newPassword
        );

        if (!result.success) {
            switch (result.error) {
                case "Invalid current password":
                    return unauthorized(res, result.error);

                case "User not found":
                    return notFound(res, result.error);

                // case "New password is too weak":
                // case "New password must be different from current password":
                //   return validationError(res, result.error);

                default:
                    return badRequest(res, result.error ?? "Could not change password");
            }
        }

        return ok(res, { success: true });
    } catch (err) {
        return serverError(res, err);
    }
};
