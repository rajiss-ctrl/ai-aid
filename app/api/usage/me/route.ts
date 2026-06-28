import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId, org } = await getTenant();

    // Get user's chat messages
    const userMessages = await prisma.chatMessage.findMany({
      where: { userId, orgId: org.id },
      orderBy: { createdAt: "asc" },
    });

    // Estimate tokens from messages (1 token ≈ 4 chars)
    let userTokens = 0;
    for (const msg of userMessages) {
      if (msg.role === "assistant") {
        userTokens += Math.ceil(msg.content.length / 4);
      }
    }
    const userCost = userTokens * 0.00003;

    // Get daily breakdown from messages
    const dailyMap: Record<string, number> = {};
    for (const msg of userMessages) {
      if (msg.role === "assistant") {
        const day = msg.createdAt.toISOString().split("T")[0];
        const tokens = Math.ceil(msg.content.length / 4);
        dailyMap[day] = (dailyMap[day] || 0) + tokens;
      }
    }

    const dailyHistory = Object.entries(dailyMap)
      .map(([date, tokens]) => ({ date, tokens }))
      .slice(-30);

    // Recent activity grouped by date
    const activityMap: Record<string, { messages: number; tokens: number }> = {};
    for (const msg of userMessages) {
      if (msg.role === "assistant") {
        const day = msg.createdAt.toISOString().split("T")[0];
        if (!activityMap[day]) activityMap[day] = { messages: 0, tokens: 0 };
        activityMap[day].messages++;
        activityMap[day].tokens += Math.ceil(msg.content.length / 4);
      }
    }

    const recentActivity = Object.entries(activityMap)
      .map(([date, data]) => ({
        date,
        messages: data.messages,
        tokens: data.tokens,
        avgPerMessage: data.messages ? Math.floor(data.tokens / data.messages) : 0,
      }))
      .slice(0, 7);

    return NextResponse.json({
      myTokens: userTokens,
      myCost: userCost,
      quotaTotal: org.tokenLimit,
      quotaRemainingPercent: Math.max(0, 100 - Math.round((org.tokensUsed / org.tokenLimit) * 100)),
      plan: org.plan,
      dailyHistory,
      recentActivity,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Usage me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}