import crypto from "crypto";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET ?? "";
const ACCESS_TTL = (process.env.JWT_ACCESS_TTL ?? "15m") as SignOptions["expiresIn"];

export function signAccessToken(payload: { id: string; email: string }) {
  if (!ACCESS_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function generateOpaqueToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function addMinutes(minutes: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}
