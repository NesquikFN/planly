import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed the `middleware` file convention to `proxy` — this is
// the direct equivalent, running before every matched route is rendered.
//
// Responsibilities: (1) redirect unauthenticated users away from private
// pages, and (2) redirect already-authenticated users away from /login and
// /register. Nothing is refreshed here anymore: the backend owns the
// session cookie and its expiry, so this file only ever reads.

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"];

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "planly_session";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Asks the backend whether the cookie is a live session. The cookie's mere
 * presence is not enough: it's signed, and only the backend holds the
 * secret — trusting it here would let anyone in with a hand-written
 * cookie. The check is deliberately fail-closed on a rejected session and
 * fail-open on an unreachable backend: a dead API should show the app's
 * own error states, not bounce everyone to /login where they can't sign in
 * either.
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie) return false;

  try {
    const response = await fetch(`${API_URL}/api/me`, {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${cookie.value}` },
      cache: "no-store",
    });
    if (response.status === 401) return false;
    return response.ok;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip the round trip entirely on public pages that don't care either
  // way — everything except /login and /register, which need to know so
  // they can bounce an already-signed-in user to the dashboard.
  const needsCheck = !isPublicPath(pathname) || pathname === "/login" || pathname === "/register";
  if (!needsCheck) return NextResponse.next();

  const signedIn = await hasValidSession(request);

  if (!signedIn && !isPublicPath(pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (signedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
