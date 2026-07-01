// lib/auth.ts
import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

// Extend NextAuth types — removes need for "any"
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      orgId: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    orgId: string;
  }
  interface JWT {
    id: string;
    role: string;
    orgId: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        // ── SECURITY: rate limit — max 10 login attempts per email per 15 min
        // Prevents password brute-force attacks per account
        const { allowed } = rateLimit(
          `login:${parsed.data.email.toLowerCase()}`,
          10,
          15 * 60 * 1000
        );
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId ?? "",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = user.id ?? "";
        (token as any).role = (user as any).role ?? "MEMBER";
        (token as any).orgId = (user as any).orgId ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as any;
      session.user.id = t.id ?? "";
      session.user.role = t.role ?? "MEMBER";
      session.user.orgId = t.orgId ?? "";
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});