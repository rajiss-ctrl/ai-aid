import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { org } = await getTenant();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.usageLog.findMany({
      where: { orgId: org.id, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
      select: { totalTokens: true, costUsd: true, createdAt: true },
    });

    // Group by day for chart
    const dailyMap: Record<string, { tokens: number; cost: number }> = {};
    for (const log of logs) {
      const day = log.createdAt.toISOString().split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = { tokens: 0, cost: 0 };
      dailyMap[day].tokens += log.totalTokens;
      dailyMap[day].cost += log.costUsd;
    }

    const chartData = Object.entries(dailyMap).map(([date, d]) => ({
      date,
      tokens: d.tokens,
      cost: parseFloat(d.cost.toFixed(4)),
    }));

    // This month total
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthly = await prisma.usageLog.aggregate({
      where: { orgId: org.id, createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, costUsd: true },
    });

    return NextResponse.json({
      quota: {
        used: org.tokensUsed,
        limit: org.tokenLimit,
        plan: org.plan,
        percent: Math.round((org.tokensUsed / org.tokenLimit) * 100),
      },
      thisMonth: {
        tokens: monthly._sum.totalTokens ?? 0,
        costUsd: parseFloat((monthly._sum.costUsd ?? 0).toFixed(4)),
      },
      chartData,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}