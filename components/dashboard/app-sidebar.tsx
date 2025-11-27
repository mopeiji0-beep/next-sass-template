"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc/client"
import {
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavTree } from "@/components/dashboard/nav-tree"
import { NavUser } from "@/components/dashboard/nav-user"
import { Skeleton } from "@/components/ui/skeleton"
import { getNavItems } from "@/lib/nav-config"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations()
  const { data: userData, isLoading } = trpc.getCurrentUser.useQuery()

  // Use real user data from database
  const user = React.useMemo(() => {
    if (userData) {
      return {
        name: userData.name || "User",
        email: userData.email || "",
        avatar: userData.image || "",
      }
    }
    // Fallback while loading
    return {
      name: "",
      email: "",
      avatar: "",
    }
  }, [userData])

  const navItems = React.useMemo(() => getNavItems(t), [t])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">{t("dashboard.sidebar.brand")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavTree items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          user.email && <NavUser user={user} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
