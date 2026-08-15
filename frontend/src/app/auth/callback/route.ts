import { NextResponse } from "next/server";

// Handles the link from the email-confirmation letter:
//   /auth/callback?token=...&purpose=email_verification
//
// The token is consumed server-side (one HTTP call to the backend) rather
// than in a client component, so it never sits in browser history state
// and the user lands on a finished page instead of a spinner. Confirming
// an email does not sign anybody in — it only flips email_verified_at —
// so this always ends up on /login.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const loginUrl = new URL("/login", url.origin);

  if (!token) {
    loginUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    if (!response.ok) {
      loginUrl.searchParams.set("error", "auth_callback_failed");
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    loginUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  loginUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(loginUrl);
}
