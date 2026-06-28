// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { streamAIChat } from "@/lib/ai";
import { getTenant } from "@/lib/tenant";
import { checkTokenQuota, recordUsage } from "@/lib/quota";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(10000),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: NextRequest) {
  try {
    const { org, userId } = await getTenant();
    await checkTokenQuota(org.id);

    // Fetch user's niche
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { niche: true }
    });
    const userNiche = user?.niche || 'default';

    const body = await req.json();
    const { messages } = schema.parse(body);

    // Save user message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "user") {
      await prisma.chatMessage.create({
        data: {
          role: "user",
          content: lastMsg.content,
          userId,
          orgId: org.id,
          tokens: 0,
        },
      });
    }

    // Stream AI response with niche
    const { stream, getUsage } = await streamAIChat(messages, org.name, userNiche);

    const encoder = new TextEncoder();
    let fullResponse = "";

    const wrappedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            controller.enqueue(value);

            const lines = chunk.split("\n\n").filter(Boolean);
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) fullResponse += data.text;

                if (data.done) {
                  const { promptTokens, completionTokens } = getUsage();
                  await Promise.all([
                    prisma.chatMessage.create({
                      data: {
                        role: "assistant",
                        content: fullResponse,
                        userId,
                        orgId: org.id,
                        tokens: completionTokens,
                      },
                    }),
                    recordUsage(org.id, userId, promptTokens, completionTokens, "llama-3.1-8b-instruct")
                  ]);
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(wrappedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "TOKEN_QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Monthly token quota exceeded. Please upgrade." },
        { status: 429 }
      );
    }
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { org, userId } = await getTenant();

    const messages = await prisma.chatMessage.findMany({
      where: { orgId: org.id, userId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        role: true,
        content: true,
        tokens: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}