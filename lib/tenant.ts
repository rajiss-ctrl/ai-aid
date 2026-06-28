// lib/tenant.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTenant() {
  const session = await auth();
  
  if (!session?.user?.email) {
    throw new Error("UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true },
  });

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return {
    org: user.organization,
    userId: user.id,
    role: user.role,
    isAdmin: user.role === "OWNER" || user.role === "ADMIN",
  };
}