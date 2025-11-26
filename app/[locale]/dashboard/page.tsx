"use client"

import * as React from "react"
import { trpc } from "@/lib/trpc/client"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { Skeleton } from "@/components/ui/skeleton"

import data from "./data.json"

export default function DashboardPage() {
  const { data: userData, isLoading } = trpc.getCurrentUser.useQuery()

  if (isLoading || !userData) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="px-4 lg:px-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="px-4 lg:px-6">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  )
}
