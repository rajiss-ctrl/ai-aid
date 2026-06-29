// app/api/user/niche/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  niche: z.enum(["default", "law", "business", "medical"]),
});

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await getTenant();
    const body = await req.json();
    const { niche } = schema.parse(body);

    await prisma.user.update({
      where: { id: userId },
      data: { niche },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update niche" }, { status: 500 });
  }
}
