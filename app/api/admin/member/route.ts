import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { org, role } = await getTenant();

    if (role === "MEMBER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { orgId: org.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { chatMessages: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members: users, org });
  } catch (err: any) {
    if (err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}