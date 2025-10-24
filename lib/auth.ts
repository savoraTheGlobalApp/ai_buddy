import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-this-in-production";
const SESSION_COOKIE_NAME = "auth_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const secret = new TextEncoder().encode(SESSION_SECRET);

export interface SessionData {
  userId: string;
  authenticated: boolean;
  createdAt: number;
  [key: string]: string | number | boolean;
}

/**
 * Create a JWT session token
 */
export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    authenticated: true,
    createdAt: Date.now(),
  } as SessionData)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionData;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

/**
 * Get session from cookies (server-side)
 */
export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifySession(token.value);
}

/**
 * Get session from request (middleware)
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionData | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifySession(token.value);
}

/**
 * Set session cookie (server-side)
 */
export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createSession(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  });
}

/**
 * Clear session cookie (server-side)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

