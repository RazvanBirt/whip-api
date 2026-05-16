import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { addDays, addMinutes, generateOpaqueToken, sha256, signAccessToken } from "./auth.utils";
import { sendPasswordResetEmail } from "../../infra/mailer";

const SALT_ROUNDS = 10;

// refresh token settings
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS ?? 30);

// password reset settings
const RESET_TTL_MINUTES = Number(process.env.RESET_TTL_MINUTES ?? 30);

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function createSession(userId: string) {
  const refreshToken = generateOpaqueToken();
  const refreshTokenHash = sha256(refreshToken);

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt: addDays(REFRESH_TTL_DAYS),
    },
  });

  return { sessionId: session.id, refreshToken };
}

export const registerUser = async (UserName: string, Email: string, Password: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email: Email } });
  if (existingUser) return { success: false as const, error: "Email already registered" };

  const passwordHash = await hashPassword(Password);

  const user = await prisma.user.create({
    data: {
      email: Email,
      passwordHash,
      displayName: UserName,
    },
  });

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const { refreshToken } = await createSession(user.id);

  return { success: true as const, user, accessToken, refreshToken };
};

export const loginUser = async (Email: string, Password: string) => {
  const user = await prisma.user.findUnique({ where: { email: Email } });
  if (!user) return { success: false as const, error: "Invalid credentials" };

  const match = await verifyPassword(Password, user.passwordHash);
  if (!match) return { success: false as const, error: "Invalid credentials" };

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const { refreshToken } = await createSession(user.id);

  return { success: true as const, user, accessToken, refreshToken };
};

/**
 * Refresh token rotation:
 * - find active session by hash
 * - revoke old session
 * - create new session
 * - return new access + refresh
 */
export const refreshAuth = async (refreshToken: string) => {
  const tokenHash = sha256(refreshToken);

  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session) return { success: false as const, error: "Invalid refresh token" };

  // revoke old
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  // rotate
  const accessToken = signAccessToken({ id: session.user.id, email: session.user.email });
  const { refreshToken: newRefreshToken } = await createSession(session.user.id);

  return { success: true as const, accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (refreshToken: string) => {
  const tokenHash = sha256(refreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: tokenHash, revokedAt: null },
  });

  // Always succeed (don’t leak)
  if (!session) return { success: true as const };

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  return { success: true as const };
};

export const forgotPassword = async (email: string) => {

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: true as const };
  }

  console.log("User found:", user.id);

  const rawToken = generateOpaqueToken(32);
  const tokenHash = sha256(rawToken);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: addMinutes(RESET_TTL_MINUTES),
    },
  });

  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;
  console.log("Generated reset URL:", resetUrl);
  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }

  return { success: true as const };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = sha256(token);

  const pr = await prisma.passwordReset.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!pr) return { success: false as const, error: "Invalid or expired reset token" };

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: pr.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordReset.update({
      where: { id: pr.id },
      data: { usedAt: new Date() },
    }),
    // Optional but recommended: revoke all sessions on password reset
    prisma.session.updateMany({
      where: { userId: pr.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { success: true as const };
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false as const, error: "User not found" };

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return { success: false as const, error: "Invalid current password" };

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    }),
    // Optional but recommended: revoke all existing refresh sessions
    prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { success: true as const };
};
