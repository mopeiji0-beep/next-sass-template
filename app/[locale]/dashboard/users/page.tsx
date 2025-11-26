"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UserManagementDrawer } from "@/components/user-management-drawer"
import { ToolbarWithFilters, type SearchFiltersState, type ToolbarButtonConfig, type StatusOption } from "@/components/toolbar-with-filters"
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserX,
  IconRefresh,
  IconArrowsLeftRight,
  IconLoader2,
} from "@tabler/icons-react"
import { toast } from "sonner"

const defaultFilters: SearchFiltersState = {
  keyword: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
}

export default function UsersPage() {
  const t = useTranslations("dashboard.userManagement")
  const [page, setPage] = React.useState(1)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<SearchFiltersState>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<SearchFiltersState>(defaultFilters)

  const { data, isLoading, isFetching, refetch } = trpc.getUsers.useQuery({
    page,
    pageSize: 10,
    search: appliedFilters.keyword || undefined,
    status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
    dateFrom: appliedFilters.dateFrom || undefined,
    dateTo: appliedFilters.dateTo || undefined,
  })

  const deleteUserMutation = trpc.deleteUser.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"))
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.userNotFound"))
    },
  })

  const toggleUserStatusMutation = trpc.toggleUserStatus.useMutation({
    onSuccess: () => {
      toast.success(t("toggleSuccess"))
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.userNotFound"))
    },
  })

  const handleDelete = (id: string) => {
    if (confirm(t("deleteConfirm"))) {
      deleteUserMutation.mutate({ id })
    }
  }

  const handleToggleStatus = (id: string, isActive: boolean) => {
    toggleUserStatusMutation.mutate({ id, isActive: !isActive })
  }

  const handleEdit = (id: string) => {
    setEditingUser(id)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingUser(null)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingUser(null)
    refetch()
  }

  const handleSearch = () => {
    setPage(1)
    setAppliedFilters(filters)
  }

  const toolbarButtons: ToolbarButtonConfig[] = [
    {
      key: "refresh",
      label: t("actionsBar.refresh"),
      variant: "outline",
      icon: IconRefresh,
      onClick: () => refetch(),
    },
    {
      key: "create",
      label: t("actionsBar.create"),
      icon: IconPlus,
      onClick: handleAdd,
    },
    {
      key: "delete",
      label: t("actionsBar.delete"),
      variant: "secondary",
      icon: IconTrash,
      onClick: () => toast.info(t("featureComingSoon")),
    },
    {
      key: "transfer",
      label: t("actionsBar.transfer"),
      variant: "secondary",
      icon: IconArrowsLeftRight,
      onClick: () => toast.info(t("featureComingSoon")),
    },
  ]

  const statusOptions: StatusOption[] = [
    { value: "all", label: t("filters.statusAll") },
    { value: "active", label: t("filters.statusActive") },
    { value: "inactive", label: t("filters.statusInactive") },
  ]

  const toolbarLabels = {
    keywordPlaceholder: t("filters.keywordPlaceholder"),
    statusLabel: t("filters.status"),
    statusOptions,
    dateFrom: t("filters.dateFrom"),
    dateTo: t("filters.dateTo"),
    search: t("filters.search"),
  }

  const isInitialLoading = isLoading && !data
  const isRefetching = isFetching && !!data

  if (isInitialLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <ToolbarWithFilters
        buttons={toolbarButtons}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        labels={toolbarLabels}
        isSearching={isFetching && !isLoading}
      />

      <div className="relative rounded-md border">
        {isRefetching && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
            <IconLoader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("createdAt")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              data?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user.id)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        title={user.isActive ? t("disableUser") : t("enableUser")}
                      >
                        {user.isActive ? (
                          <IconUserX className="h-4 w-4" />
                        ) : (
                          <IconUserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("page")} {data.page} / {data.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}

      <UserManagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        userId={editingUser}
        onSuccess={handleDrawerClose}
      />
    </div>
  )
}

