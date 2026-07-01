// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── SECURITY: validate and cap all inputs — no raw DB writes ─────────────
const updateSchema = z.object({
  orgName: z.string().min(2).max(100).trim(),
  // tokenLimit: minimum 10k, hard cap at 100M to prevent abuse
  tokenLimit: z.number().int().min(10_000).max(100_000_000),
  defaultNiche: z.enum(["default", "law", "business", "medical"]),
});

export async function GET() {
  try {
    const { org } = await getTenant();
    return NextResponse.json({
      orgName: org.name,
      tokenLimit: org.tokenLimit,
      defaultNiche: (org as any).defaultNiche ?? "default",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { org, role } = await getTenant();

    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = updateSchema.parse(await req.json());

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: body.orgName,
        tokenLimit: body.tokenLimit,
        defaultNiche: body.defaultNiche,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    // Log internally, return generic message
    console.error("Settings update error:", err?.code ?? err?.message);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
