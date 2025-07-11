import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import { Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "../../../../lib/prisma"
import GoogleProvider from "next-auth/providers/google"

// Define types to fix TypeScript errors
type SessionParams = {
  session: Session;
  token: JWT;
}

type JWTParams = {
  token: JWT;
  user?: User;
}

// NextAuth configuration
const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    })
    // We'll implement credential provider later after fixing schema issues
  ],
  callbacks: {
    async session({ session, token }: SessionParams) {
      if (session?.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }: JWTParams) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(config)
