import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes only OWNER/ADMIN can access
const ADMIN_ONLY_ROUTES = ["/dashboard/users"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthed = !!token;
  const role = (token?.role as string) ?? "MEMBER";
  const isAdmin = role === "OWNER" || role === "ADMIN";

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/usage") ||
    pathname.startsWith("/api/admin");

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  // Redirect unauthenticated users to login
  if (isDashboard && !isAuthed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard/chat", req.url));
  }

  // Redirect MEMBER users away from admin-only routes
  if (isAuthed && !isAdmin) {
    const blocked = ADMIN_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (blocked) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/chat/:path*",
    "/api/usage/:path*",
    "/api/admin/:path*",
    "/login",
    "/register",
  ],
};