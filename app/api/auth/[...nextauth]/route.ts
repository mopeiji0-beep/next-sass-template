import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const handler = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile, email, credentials }) {
      // Allow sign in
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign in
      console.log("User signed in:", user.email);
    },
    async signOut({ session, token }) {
      // Log sign out
      console.log("User signed out");
    },
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };

