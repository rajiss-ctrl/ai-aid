// app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const name = session.user.name ?? session.user.email?.split("@")[0] ?? "User";
    // Return just the first name for the greeting
    const firstName = name.split(" ")[0];
    return NextResponse.json({ name, firstName });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
