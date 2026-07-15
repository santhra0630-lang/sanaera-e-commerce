import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@domain.com" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "boolean" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });
        if (!user || !user.hashedPassword) return null;
        const ok = await verifyPassword(credentials.password, user.hashedPassword);
        if (!ok) return null;
        // Return minimal user object — callbacks will enrich the token
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null,
          roleName: user.role?.name as unknown as string | null,
        } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, persist user id and roleName
      if (user) {
        token.id = (user as any).id ?? token.id;
        if ((user as any).roleName) token.roleName = (user as any).roleName;
      }

      // Respect a token.remember flag — set effectiveExp accordingly
      const now = Math.floor(Date.now() / 1000);
      if ((token as any).remember) {
        // 30 days
        token.effectiveExp = now + 60 * 60 * 24 * 30;
      } else {
        // 1 day
        token.effectiveExp = now + 60 * 60 * 24 * 1;
      }

      return token;
    },
    async session({ session, token }) {
      (session as any).user = (session as any).user || {};
      (session as any).user.id = token.id as string;
      (session as any).user.roleName = (token as any).roleName ?? null;

      // Set session.expires from effectiveExp to implement remember-me semantics
      if ((token as any).effectiveExp) {
        (session as any).expires = new Date(((token as any).effectiveExp as number) * 1000).toISOString();
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
