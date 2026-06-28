import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { org, role } = await getTenant();

    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyMessages = await prisma.chatMessage.findMany({
      where: {
        orgId: org.id,
        role: "assistant",
        createdAt: { gte: startOfMonth }
      },
    });

    const totalTokens = monthlyMessages.reduce((sum, msg) => sum + (msg.tokens || Math.ceil(msg.content.length / 4)), 0);
    const totalCost = totalTokens * 0.00003;

    const activeUsers = await prisma.user.count({
      where: {
        orgId: org.id,
        chatMessages: { some: { createdAt: { gte: startOfMonth } } }
      }
    });

    return NextResponse.json({
      totalTokens,
      totalCost: parseFloat(totalCost.toFixed(4)),
      activeUsers: activeUsers || 1,
      avgTokensPerUser: activeUsers ? Math.floor(totalTokens / activeUsers) : totalTokens,
    });
  } catch (err: any) {
    console.error("Summary error:", err);
    return NextResponse.json({
      totalTokens: 0,
      totalCost: 0,
      activeUsers: 1,
      avgTokensPerUser: 0,
    });
  }
}