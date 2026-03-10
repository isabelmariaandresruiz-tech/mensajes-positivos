import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "animocerca_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionClaims = JWTPayload & {
  email: string;
  name: string;
  username?: string;
};

export type AppSession = {
  userId: string;
  email: string;
  name: string;
  username?: string;
};

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-only-change-me-before-production",
  );
}

function mapClaimsToSession(claims: SessionClaims): AppSession | null {
  if (!claims.sub || typeof claims.sub !== "string") {
    return null;
  }

  if (typeof claims.email !== "string" || typeof claims.name !== "string") {
    return null;
  }

  const session: AppSession = {
    userId: claims.sub,
    email: claims.email,
    name: claims.name,
  };

  if (typeof claims.username === "string" && claims.username.length > 0) {
    session.username = claims.username;
  }

  return session;
}

function extractCookieValue(rawCookieHeader: string | null, cookieName: string): string | null {
  if (!rawCookieHeader) {
    return null;
  }

  const found = rawCookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));

  if (!found) {
    return null;
  }

  return found.slice(cookieName.length + 1);
}

export async function createSessionToken(session: AppSession): Promise<string> {
  return new SignJWT({
    email: session.email,
    name: session.name,
    username: session.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string | null): Promise<AppSession | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return mapClaimsToSession(payload as SessionClaims);
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  return verifySessionToken(token);
}

export async function getRequestSession(request: Request): Promise<AppSession | null> {
  const token = extractCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
