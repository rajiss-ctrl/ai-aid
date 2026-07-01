// proxy.ts — Next.js 16 edge proxy (replaces middleware.ts)
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes only OWNER/ADMIN can access
const ADMIN_ONLY_ROUTES = ["/dashboard/users"];

// ── SECURITY: whitelist of allowed post-login redirect paths ─────────────
// Without this, an attacker could craft a link like /login?callbackUrl=https://evil.com
// and redirect the user off-site after they authenticate (open redirect)
function safeCallbackUrl(pathname: string): string {
  try {
    // Only allow paths that start with / and are not protocol-relative (//)
    if (pathname.startsWith("/") && !pathname.startsWith("//")) {
      return pathname;
    }
  } catch {}
  return "/dashboard/chat";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Determine cookie name — NextAuth/Auth.js uses __Secure- prefix on HTTPS
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  });

  const isAuthed = !!token;
  const role = (token?.role as string) ?? "MEMBER";
  const isAdmin = role === "OWNER" || role === "ADMIN";

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/usage") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/settings") ||  // ← was missing
    pathname.startsWith("/api/user");         // ← was missing

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  // Redirect unauthenticated users to login
  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    // ── SECURITY: validate the callbackUrl to prevent open redirect ───────
    loginUrl.searchParams.set("callbackUrl", safeCallbackUrl(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(
      new URL("/dashboard/chat", req.nextUrl.origin)
    );
  }

  // Redirect MEMBER users away from admin-only routes
  if (isAuthed && !isAdmin) {
    const blocked = ADMIN_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (blocked) {
      return NextResponse.redirect(
        new URL("/dashboard", req.nextUrl.origin)
      );
    }
  }

  return NextResponse.next();
}

export default async function middleware(req: NextRequest) {
  return proxy(req);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/chat/:path*",
    "/api/usage/:path*",
    "/api/admin/:path*",
    "/api/settings/:path*",  // ← added
    "/api/user/:path*",      // ← added
    "/login",
    "/register",
  ],
};
