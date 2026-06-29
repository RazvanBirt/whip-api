process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_ACCESS_TTL = "15m";

import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../auth.service", () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    refreshAuth: jest.fn(),
    logoutUser: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
}));

import authRoutes from "../auth.routes";
import {
    registerUser,
    loginUser,
    refreshAuth,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword,
} from "../auth.service";

const mockedRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
const mockedLoginUser = loginUser as jest.MockedFunction<typeof loginUser>;
const mockedRefreshAuth = refreshAuth as jest.MockedFunction<typeof refreshAuth>;
const mockedLogoutUser = logoutUser as jest.MockedFunction<typeof logoutUser>;
const mockedForgotPassword = forgotPassword as jest.MockedFunction<typeof forgotPassword>;
const mockedResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;
const mockedChangePassword = changePassword as jest.MockedFunction<typeof changePassword>;

function createTestApp() {
    const app = express();

    app.use(express.json());
    app.use("/api/auth", authRoutes);

    return app;
}

function makeAccessToken(payload = { id: "user-1", email: "test@example.com" }) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
        expiresIn: "15m",
    });
}

describe("Auth routes", () => {
    let app: express.Express;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe("POST /api/auth/register", () => {
        it("returns 400 when Email is missing", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "Email",
            });
            expect(mockedRegisterUser).not.toHaveBeenCalled();
        });

        it("returns 400 when Password is missing", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Email: "test@example.com",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "Password",
            });
            expect(mockedRegisterUser).not.toHaveBeenCalled();
        });

        it("returns 400 for invalid email", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Email: "not-an-email",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid email address");
            expect(mockedRegisterUser).not.toHaveBeenCalled();
        });

        it("returns 400 for weak password", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Email: "test@example.com",
                    Password: "weak",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("Password must be at least 8 characters");
            expect(mockedRegisterUser).not.toHaveBeenCalled();
        });

        it("returns 409 when email is already registered", async () => {
            mockedRegisterUser.mockResolvedValueOnce({
                success: false,
                error: "Email already registered",
            });

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Email: "test@example.com",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("Email already registered");

            expect(mockedRegisterUser).toHaveBeenCalledWith(
                "Razvan",
                "test@example.com",
                "StrongPass1!"
            );
        });

        it("returns 201 with user and tokens on successful register", async () => {
            mockedRegisterUser.mockResolvedValueOnce({
                success: true,
                user: {
                    id: "user-1",
                    email: "test@example.com",
                    displayName: "Razvan",
                } as never,
                accessToken: "access-token",
                refreshToken: "refresh-token",
            });

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Email: "test@example.com",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({
                success: true,
                user: {
                    id: "user-1",
                    email: "test@example.com",
                    displayName: "Razvan",
                },
                accessToken: "access-token",
                refreshToken: "refresh-token",
            });
        });

        it("returns 500 when register service throws", async () => {
            mockedRegisterUser.mockRejectedValueOnce(new Error("DB down"));

            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    UserName: "Razvan",
                    Email: "test@example.com",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });

    describe("POST /api/auth/login", () => {
        it("returns 400 when Email is missing", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "Email",
            });
            expect(mockedLoginUser).not.toHaveBeenCalled();
        });

        it("returns 400 when Password is missing", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    Email: "test@example.com",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "Password",
            });
            expect(mockedLoginUser).not.toHaveBeenCalled();
        });

        it("returns 401 for invalid credentials", async () => {
            mockedLoginUser.mockResolvedValueOnce({
                success: false,
                error: "Invalid credentials",
            });

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    Email: "test@example.com",
                    Password: "WrongPass1!",
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid credentials");
        });

        it("returns 200 with user and tokens on successful login", async () => {
            mockedLoginUser.mockResolvedValueOnce({
                success: true,
                user: {
                    id: "user-1",
                    email: "test@example.com",
                } as never,
                accessToken: "access-token",
                refreshToken: "refresh-token",
            });

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    Email: "test@example.com",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                user: {
                    id: "user-1",
                    email: "test@example.com",
                },
                accessToken: "access-token",
                refreshToken: "refresh-token",
            });
        });

        it("returns 500 when login service throws", async () => {
            mockedLoginUser.mockRejectedValueOnce(new Error("DB down"));

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    Email: "test@example.com",
                    Password: "StrongPass1!",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });

    describe("POST /api/auth/refresh", () => {
        it("returns 400 when refreshToken is missing", async () => {
            const res = await request(app)
                .post("/api/auth/refresh")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "refreshToken",
            });
            expect(mockedRefreshAuth).not.toHaveBeenCalled();
        });

        it("returns 401 for invalid refresh token", async () => {
            mockedRefreshAuth.mockResolvedValueOnce({
                success: false,
                error: "Invalid refresh token",
            });

            const res = await request(app)
                .post("/api/auth/refresh")
                .send({
                    refreshToken: "bad-token",
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid refresh token");
        });

        it("returns 200 with rotated tokens", async () => {
            mockedRefreshAuth.mockResolvedValueOnce({
                success: true,
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
            });

            const res = await request(app)
                .post("/api/auth/refresh")
                .send({
                    refreshToken: "old-refresh-token",
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
            });

            expect(mockedRefreshAuth).toHaveBeenCalledWith("old-refresh-token");
        });

        it("returns 500 when refresh service throws", async () => {
            mockedRefreshAuth.mockRejectedValueOnce(new Error("DB down"));

            const res = await request(app)
                .post("/api/auth/refresh")
                .send({
                    refreshToken: "refresh-token",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });

    describe("POST /api/auth/logout", () => {
        it("returns 400 when refreshToken is missing", async () => {
            const res = await request(app)
                .post("/api/auth/logout")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "refreshToken",
            });
            expect(mockedLogoutUser).not.toHaveBeenCalled();
        });

        it("returns 204 on successful logout", async () => {
            mockedLogoutUser.mockResolvedValueOnce({
                success: true,
            });

            const res = await request(app)
                .post("/api/auth/logout")
                .send({
                    refreshToken: "refresh-token",
                });

            expect(res.status).toBe(204);
            expect(res.body).toEqual({
                success: true,
            });

            expect(mockedLogoutUser).toHaveBeenCalledWith("refresh-token");
        });

        it("returns 500 when logout service throws", async () => {
            mockedLogoutUser.mockRejectedValueOnce(new Error("DB down"));

            const res = await request(app)
                .post("/api/auth/logout")
                .send({
                    refreshToken: "refresh-token",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });

    describe("POST /api/auth/forgot-password", () => {
        it("returns 400 when Email is missing", async () => {
            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "Email",
            });
            expect(mockedForgotPassword).not.toHaveBeenCalled();
        });

        it("returns 200 without leaking whether the email exists", async () => {
            mockedForgotPassword.mockResolvedValueOnce({
                success: true,
            });

            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({
                    Email: "unknown@example.com",
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
            });

            expect(mockedForgotPassword).toHaveBeenCalledWith("unknown@example.com");
        });

        it("returns 500 when forgot password service throws", async () => {
            mockedForgotPassword.mockRejectedValueOnce(new Error("Mailer down"));

            const res = await request(app)
                .post("/api/auth/forgot-password")
                .send({
                    Email: "test@example.com",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });

    describe("POST /api/auth/reset-password", () => {
        it("returns 400 when Token is missing", async () => {
            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    NewPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "Token",
            });
            expect(mockedResetPassword).not.toHaveBeenCalled();
        });

        it("returns 400 when NewPassword is missing", async () => {
            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    Token: "reset-token",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "NewPassword",
            });
            expect(mockedResetPassword).not.toHaveBeenCalled();
        });

        it("returns 422 for invalid or expired reset token", async () => {
            mockedResetPassword.mockResolvedValueOnce({
                success: false,
                error: "Invalid or expired reset token",
            });

            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    Token: "bad-token",
                    NewPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(422);
            expect(res.body.error).toBe("Invalid or expired reset token");
        });

        it("returns 200 on successful password reset", async () => {
            mockedResetPassword.mockResolvedValueOnce({
                success: true,
            });

            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    Token: "reset-token",
                    NewPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
            });

            expect(mockedResetPassword).toHaveBeenCalledWith(
                "reset-token",
                "NewStrongPass1!"
            );
        });

        it("returns 500 when reset password service throws", async () => {
            mockedResetPassword.mockRejectedValueOnce(new Error("DB down"));

            const res = await request(app)
                .post("/api/auth/reset-password")
                .send({
                    Token: "reset-token",
                    NewPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });

    describe("POST /api/auth/change-password", () => {
        it("returns 401 without Authorization header", async () => {
            const res = await request(app)
                .post("/api/auth/change-password")
                .send({
                    currentPassword: "OldStrongPass1!",
                    newPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Missing Authorization header");
            expect(mockedChangePassword).not.toHaveBeenCalled();
        });

        it("returns 401 with invalid token", async () => {
            const res = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", "Bearer invalid-token")
                .send({
                    currentPassword: "OldStrongPass1!",
                    newPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid or expired token");
            expect(mockedChangePassword).not.toHaveBeenCalled();
        });

        it("returns 400 when currentPassword is missing", async () => {
            const token = makeAccessToken();

            const res = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    newPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "currentPassword",
            });
            expect(mockedChangePassword).not.toHaveBeenCalled();
        });

        it("returns 400 when newPassword is missing", async () => {
            const token = makeAccessToken();

            const res = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    currentPassword: "OldStrongPass1!",
                });

            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                error: "Missing required field",
                field: "newPassword",
            });
            expect(mockedChangePassword).not.toHaveBeenCalled();
        });

        it("returns 401 when current password is wrong", async () => {
            const token = makeAccessToken();

            mockedChangePassword.mockResolvedValueOnce({
                success: false,
                error: "Invalid current password",
            });

            const res = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    currentPassword: "WrongPass1!",
                    newPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid current password");

            expect(mockedChangePassword).toHaveBeenCalledWith(
                "user-1",
                "WrongPass1!",
                "NewStrongPass1!"
            );
        });

        it("returns 200 on successful password change", async () => {
            const token = makeAccessToken();

            mockedChangePassword.mockResolvedValueOnce({
                success: true,
            });

            const res = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    currentPassword: "OldStrongPass1!",
                    newPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(200);
            expect(res.body).toEqual({
                success: true,
            });

            expect(mockedChangePassword).toHaveBeenCalledWith(
                "user-1",
                "OldStrongPass1!",
                "NewStrongPass1!"
            );
        });

        it("returns 500 when change password service throws", async () => {
            const token = makeAccessToken();

            mockedChangePassword.mockRejectedValueOnce(new Error("DB down"));

            const res = await request(app)
                .post("/api/auth/change-password")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    currentPassword: "OldStrongPass1!",
                    newPassword: "NewStrongPass1!",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Internal server error");
        });
    });
});