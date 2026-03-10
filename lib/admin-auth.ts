import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

const SESSION_TOKENS = new Map<string, number>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const AUTH_RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const AUTH_MAX_ATTEMPTS = 5;
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 min
const VOTE_RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const VOTE_MAX_PER_WINDOW = 50;
const VOTE_WINDOW_MS = 60 * 1000; // 1 min

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  if (password.length !== adminPassword.length) return false;
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(adminPassword, "utf8");
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const token = crypto.randomUUID();
  SESSION_TOKENS.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function isValidSessionToken(token: string | null): boolean {
  if (!token) return false;
  const expiry = SESSION_TOKENS.get(token);
  if (!expiry || Date.now() > expiry) {
    SESSION_TOKENS.delete(token);
    return false;
  }
  return true;
}

export function invalidateSessionToken(token: string): void {
  SESSION_TOKENS.delete(token);
}

export function checkAuthRateLimit(request: NextRequest): boolean {
  return checkRateLimit(AUTH_RATE_LIMIT, getClientKey(request), AUTH_MAX_ATTEMPTS, AUTH_WINDOW_MS);
}

export function checkVoteRateLimit(request: NextRequest): boolean {
  return checkRateLimit(VOTE_RATE_LIMIT, getClientKey(request), VOTE_MAX_PER_WINDOW, VOTE_WINDOW_MS);
}

export function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  return isValidSessionToken(token || null);
}
