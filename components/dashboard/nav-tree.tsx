"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"
import { Link } from "@/i18n/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { IconChevronRight } from "@tabler/icons-react"

export type NavTreeItem = {
  title: string
  titleKey?: string
  url?: string
  icon?: Icon
  children?: NavTreeItem[]
}

export function NavTree({
  items,
}: {
  items: NavTreeItem[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isActive = Boolean(item.url && pathname === item.url)
            const isParentActive = Boolean(
              item.children?.some(
                (child) =>
                  child.url === pathname ||
                  child.children?.some((grandchild) => grandchild.url === pathname)
              )
            )

            if (hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <Collapsible defaultOpen={isParentActive}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={isParentActive}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children?.map((child) => {
                          const childIsActive = Boolean(child.url && pathname === child.url)
                          return (
                            <SidebarMenuSubItem key={child.title}>
                              {child.url ? (
                                <SidebarMenuSubButton asChild isActive={childIsActive}>
                                  <Link href={child.url}>
                                    {child.icon && <child.icon />}
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              ) : null}
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              )
            }

            if (item.url) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={isActive}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return null
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

