import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { role } = await getTenant();
    
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, niche } = await req.json();

    await prisma.user.update({
      where: { id: userId },
      data: { niche } as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update niche" }, { status: 500 });
  }
}