// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit, getIp } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(128),
  orgName: z.string().min(2).max(100),
  niche: z.enum(["default", "law", "business", "medical"]).default("default"),
  inviteToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // ── SECURITY: rate limit — max 5 registrations per IP per 15 minutes ───
  const ip = getIp(req);
  const { allowed, retryAfter } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

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

      if (!invite) {
        return NextResponse.json(
          { error: "Invite link is invalid or has expired" },
          { status: 400 }
        );
      }

      // ── SECURITY: invite email must match the registering email ──────────
      // Without this, anyone who obtains a token can join as someone else
      if (invite.email.toLowerCase() !== data.email.toLowerCase()) {
        return NextResponse.json(
          { error: "This invite was sent to a different email address" },
          { status: 403 }
        );
      }
    }

    if (invite) {
      // Joining existing organization via invite
      const userRole = invite.role === "ADMIN" ? "ADMIN" : "MEMBER";

      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: userRole,
            orgId: invite.orgId,
            niche: data.niche,
          },
        });

        await tx.invite.update({
          where: { id: invite.id },
          data: { used: true },
        });
      });
    } else {
      // Creating new organization — user becomes OWNER
      const slug =
        data.orgName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 40) +
        "-" +
        Date.now();

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
          role: "OWNER",
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
    // ── SECURITY: never return raw Prisma errors or stack traces ─────────
    // They expose table names, column names, and internal DB structure
    if (err?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    // Log internally but return a generic message to the client
    console.error("Registration error:", err?.code ?? err?.message ?? err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
