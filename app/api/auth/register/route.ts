import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(2),
  niche: z.string().default("default"),
  inviteToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check email not already used
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Check for invite token
    let invite = null;
    if (data.inviteToken) {
      invite = await prisma.invite.findFirst({
        where: {
          token: data.inviteToken,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });
    }

    let orgId: string;
    let userRole: "OWNER" | "ADMIN" | "MEMBER" = "MEMBER";

    if (invite) {
      // Joining existing organization via invite
      orgId = invite.orgId;
      userRole = invite.role === "ADMIN" ? "ADMIN" : "MEMBER";
      
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: userRole,
            orgId: orgId,
            niche: data.niche,
          },
        });

        await tx.invite.update({
          where: { id: invite.id },
          data: { used: true },
        });
      });
    } else {
      // Creating new organization - user becomes OWNER
      const slug = data.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40) + "-" + Date.now();

      const org = await prisma.organization.create({
        data: {
          name: data.orgName,
          slug,
          plan: "FREE",
          tokenLimit: 10000,
          defaultNiche: data.niche,
        },
      });

      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: "OWNER",  // ✅ First user is OWNER (super admin of org)
          orgId: org.id,
          niche: data.niche,
        },
      });
    }

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Registration error:", err);
    
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: err.message || "Something went wrong", detail: err?.meta || err?.code },
      { status: 500 }
    );
  }
}