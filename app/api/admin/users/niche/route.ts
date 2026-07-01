// app/api/admin/users/niche/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1),
  niche: z.enum(["default", "law", "business", "medical"]),
});

export async function PUT(req: NextRequest) {
  try {
    const { org, role } = await getTenant();

    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = schema.parse(await req.json());

    // ── SECURITY: verify the target user belongs to the caller's org ──────
    // Without this check, any admin could update users in other orgs (IDOR)
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { orgId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // OWNER can update any user; ADMIN is scoped to their own org only
    if (role === "ADMIN" && targetUser.orgId !== org.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: body.userId },
      data: { niche: body.niche },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    if (err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update niche" }, { status: 500 });
  }
}
