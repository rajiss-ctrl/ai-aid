// lib/quota.ts
import { prisma } from "@/lib/prisma";

export async function checkTokenQuota(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { tokensUsed: true, tokenLimit: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  if (org.tokensUsed >= org.tokenLimit) {
    throw new Error("TOKEN_QUOTA_EXCEEDED");
  }

  return true;
}

export async function recordUsage(
  orgId: string,
  userId: string,
  promptTokens: number,
  completionTokens: number,
  model: string = "llama-3.1-8b-instruct"
) {
  const totalTokens = promptTokens + completionTokens;
  const costUsd = totalTokens * 0.00003;

  await prisma.usageLog.create({
    data: {
      orgId,
      userId,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      model,
    },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { tokensUsed: { increment: totalTokens } },
  });

  return { totalTokens, costUsd };
}