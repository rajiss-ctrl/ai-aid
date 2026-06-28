import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { org, role } = await getTenant();

    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const messages = await prisma.chatMessage.findMany({
      where: {
        orgId: org.id,
        role: "assistant",
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: "asc" },
    });

    // Daily trend
    const dailyMap: Record<string, number> = {};
    for (const msg of messages) {
      const day = msg.createdAt.toISOString().split("T")[0];
      const tokens = msg.tokens || Math.ceil(msg.content.length / 4);
      dailyMap[day] = (dailyMap[day] || 0) + tokens;
    }

    const daily = Object.entries(dailyMap)
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Niche breakdown from users
    const users = await prisma.user.findMany({
      where: { orgId: org.id },
      select: { niche: true },
    });

    const nicheMap: Record<string, number> = { law: 0, business: 0, medical: 0, default: 0 };
    for (const user of users) {
      const niche = (user as any).niche || "default";
      nicheMap[niche]++;
    }

    const nicheColors: Record<string, string> = {
      law: "#8B5CF6",
      business: "#3B82F6",
      medical: "#10B981",
      default: "#6B7280",
    };

    const byNiche = Object.entries(nicheMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: nicheColors[name],
      }));

    return NextResponse.json({ daily, byNiche });
  } catch (err: any) {
    console.error("Trends error:", err);
    return NextResponse.json({ daily: [], byNiche: [] });
  }
}