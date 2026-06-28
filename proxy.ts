import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthed = !!token;

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/usage") ||
    pathname.startsWith("/api/admin");

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (isDashboard && !isAuthed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard/chat", req.url));
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