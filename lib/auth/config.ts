import { DrizzleAdapter } from "@auth/drizzle-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { NextAuthOptions } from "next-auth";

export const authConfig: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(6),
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            throw new Error("Invalid credentials format");
          }

          const { email, password } = parsedCredentials.data;

          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user || user.length === 0) {
            throw new Error("User not found");
          }

          // Check if user has a password (for users created via credentials)
          if (!user[0].password) {
            throw new Error("Invalid authentication method");
          }

          const passwordsMatch = await bcrypt.compare(password, user[0].password);

          if (!passwordsMatch) {
            throw new Error("Invalid password");
          }

          return {
            id: user[0].id,
            email: user[0].email,
            name: user[0].name,
            image: user[0].image,
          };
        } catch (error) {
          // Log error for debugging
          console.error("Authorization error:", error);
          // Return null to indicate authentication failure
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
    signOut: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

