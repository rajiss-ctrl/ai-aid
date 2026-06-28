// app/api/usage/admin/users/route.ts
import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { role, userId } = await getTenant();
    
    console.log("Current user role:", role); // Debug

    // Only OWNER and ADMIN can access
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let users;

    if (role === "OWNER") {
      // Super Admin: Get ALL users from ALL organizations
      users = await prisma.user.findMany({
        include: {
          chatMessages: {
            where: { role: "assistant" },
          },
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      });
      console.log("Super Admin - Total users found:", users.length); // Debug
    } else {
      // Regular Admin: Get users only from their organization
      const { org } = await getTenant();
      users = await prisma.user.findMany({
        where: { orgId: org.id },
        include: {
          chatMessages: {
            where: { role: "assistant" },
          },
          organization: true,
        },
        orderBy: { createdAt: "desc" },
      });
      console.log("Regular Admin - Users in org:", users.length); // Debug
    }

    const usersWithUsage = users.map(user => {
      const totalTokens = user.chatMessages.reduce((sum, msg) => 
        sum + (msg.tokens || Math.ceil(msg.content.length / 4)), 0
      );
      const cost = totalTokens * 0.00003;
      const lastMessage = user.chatMessages.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      return {
        id: user.id,
        email: user.email,
        name: user.name || "Unnamed",
        role: user.role,
        niche: user.niche || "default",
        organizationName: user.organization?.name || "Unknown",
        tokens: totalTokens,
        cost: parseFloat(cost.toFixed(4)),
        lastActive: lastMessage?.createdAt.toISOString() || user.createdAt.toISOString(),
        messageCount: user.chatMessages.length,
      };
    });

    return NextResponse.json({ users: usersWithUsage });
  } catch (err: any) {
    console.error("Admin users error:", err);
    return NextResponse.json({ users: [], error: err.message });
  }
}