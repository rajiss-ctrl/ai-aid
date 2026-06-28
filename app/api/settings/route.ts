// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { org } = await getTenant();
    return NextResponse.json({
      orgName: org.name,
      tokenLimit: org.tokenLimit,
      defaultNiche: (org as any).defaultNiche || "default",
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

    const { orgName, tokenLimit, defaultNiche } = await req.json();

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: orgName,
        tokenLimit,
        defaultNiche,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}