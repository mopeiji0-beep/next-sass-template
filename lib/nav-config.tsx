import { type Icon } from "@tabler/icons-react"
import {
  IconDashboard,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import { type NavTreeItem } from "@/components/dashboard/nav-tree"

type NavConfigItem = {
  titleKey: string
  url?: string
  icon?: Icon
  children?: NavConfigItem[]
}

const NAV_CONFIG: NavConfigItem[] = [
  {
    titleKey: "dashboard.sidebar.navMain.dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    titleKey: "dashboard.sidebar.navMain.systemManagement",
    icon: IconSettings,
    children: [
      {
        titleKey: "dashboard.sidebar.navMain.userManagement",
        url: "/dashboard/users",
        icon: IconUsers,
      },
    ],
  },
]

function createNavItems(
  config: NavConfigItem[],
  t: (key: string) => string
): NavTreeItem[] {
  return config.map((item) => ({
    title: t(item.titleKey),
    titleKey: item.titleKey,
    url: item.url,
    icon: item.icon,
    children: item.children ? createNavItems(item.children, t) : undefined,
  }))
}

export function getNavItems(t: (key: string) => string): NavTreeItem[] {
  return createNavItems(NAV_CONFIG, t)
}

export function findNavItemByPath(
  items: NavTreeItem[],
  pathname: string
): NavTreeItem | null {
  // Normalize pathname: remove trailing slash and ensure it starts with /
  const normalizedPath = pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname
  
  for (const item of items) {
    // Check if current item matches (exact match)
    if (item.url) {
      const normalizedItemUrl = item.url.endsWith("/") && item.url !== "/"
        ? item.url.slice(0, -1)
        : item.url
      
      if (normalizedPath === normalizedItemUrl) {
        return item
      }
    }
    
    // Check children recursively
    if (item.children) {
      const found = findNavItemByPath(item.children, normalizedPath)
      if (found) {
        return found
      }
    }
  }
  
  return null
}

