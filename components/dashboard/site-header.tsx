"use client"

import * as React from "react"
import { usePathname } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LocaleSwitcher } from "@/components/common/locale-switcher"
import { getNavItems, findNavItemByPath } from "@/lib/nav-config"

export function SiteHeader() {
  const pathname = usePathname()
  const t = useTranslations()

  // Get menu items and find the current one
  const navItems = React.useMemo(() => getNavItems(t), [t])
  const currentItem = React.useMemo(() => {
    // usePathname from next-intl already returns path without locale
    // pathname format: /dashboard or /dashboard/users
    // Ensure path starts with /
    const normalizedPath = pathname.startsWith("/") 
      ? pathname 
      : "/" + pathname
    
    return findNavItemByPath(navItems, normalizedPath)
  }, [pathname, navItems])

  // Get title from menu item, fallback to dashboard
  const title = currentItem?.title || t("dashboard.sidebar.navMain.dashboard")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}
