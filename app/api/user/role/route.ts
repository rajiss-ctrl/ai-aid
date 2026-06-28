// app/api/user/role/route.ts
import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const { role } = await getTenant();
    // ✅ OWNER and ADMIN are both considered admin
    const isAdmin = role === "OWNER" || role === "ADMIN";
    return NextResponse.json({ role: isAdmin ? "admin" : "user" });
  } catch (error) {
    console.error("Role API error:", error);
    return NextResponse.json({ role: "user" });
  }
}