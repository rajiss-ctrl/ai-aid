import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(req: NextRequest) {
  try {
    const { org, role } = await getTenant();

    if (role === "MEMBER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { email, role: inviteRole } = schema.parse(await req.json());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: { email, role: inviteRole, orgId: org.id, expiresAt },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?invite=${invite.token}`;

    return NextResponse.json({ message: "Invite created", inviteUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}