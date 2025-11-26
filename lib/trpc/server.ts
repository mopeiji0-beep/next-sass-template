import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { type AppRouter } from "@/server/trpc/routers/_app";

export const trpcServer = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`
        : "http://localhost:3220/api/trpc",
      transformer: superjson,
    }),
  ],
});

