import NextAuth from "next-auth";
import { getServerSession } from "next-auth/next";
import { authConfig } from "./config";

const handler = NextAuth(authConfig);

export default handler;
export { handler as GET, handler as POST };

// Export auth function for server-side usage
export async function auth() {
  return await getServerSession(authConfig);
}

