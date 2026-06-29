// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes only OWNER/ADMIN can access
const ADMIN_ONLY_ROUTES = ["/dashboard/users"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role ?? "MEMBER";
  const isAdmin = role === "OWNER" || role === "ADMIN";
  const isLoggedIn = !!req.auth;

  // Redirect unauthenticated users to login
  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect MEMBER users away from admin-only routes
  if (isLoggedIn && !isAdmin) {
    const blocked = ADMIN_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );
    if (blocked) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
