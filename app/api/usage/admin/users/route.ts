// app/api/usage/admin/users/route.ts
import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ── SECURITY: call getTenant() once, reuse result everywhere ─────────
    // Calling it twice wastes two DB round-trips and creates a subtle race
    // condition where the role could theoretically differ between calls
    const { org, role } = await getTenant();

    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // OWNER sees all users platform-wide; ADMIN is scoped to their own org
    const whereClause = role === "OWNER" ? {} : { orgId: org.id };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        chatMessages: {
          where: { role: "assistant" },
          select: { tokens: true, content: true, createdAt: true },
        },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const usersWithUsage = users.map((user) => {
      const totalTokens = user.chatMessages.reduce(
        (sum, msg) => sum + (msg.tokens || Math.ceil(msg.content.length / 4)),
        0
      );
      const cost = totalTokens * 0.00003;
      const lastMessage = user.chatMessages.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? "Unnamed",
        role: user.role,
        niche: user.niche ?? "default",
        organizationName: user.organization?.name ?? "Unknown",
        tokens: totalTokens,
        cost: parseFloat(cost.toFixed(4)),
        lastActive: lastMessage?.createdAt.toISOString() ?? user.createdAt.toISOString(),
        messageCount: user.chatMessages.length,
      };
    });

    return NextResponse.json({ users: usersWithUsage });
  } catch (err: any) {
    if (err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin users error:", err?.code ?? err?.message);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
