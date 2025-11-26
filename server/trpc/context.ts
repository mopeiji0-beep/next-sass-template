import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function createContext() {
  const session = await getServerSession(authConfig);

  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

