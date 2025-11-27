import { cache } from "react"
import { createContext } from "./context"
import { appRouter } from "./routers/_app"

export const createCaller = cache(async () => {
  const ctx = await createContext()
  return appRouter.createCaller(ctx)
})

