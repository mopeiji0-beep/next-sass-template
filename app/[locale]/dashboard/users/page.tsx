"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserManagementDrawer } from "@/components/user/user-management-drawer"
import { ChangePasswordDialog } from "@/components/user/change-password-dialog"
import { CrudTable, type CrudTableColumn } from "@/components/common/crud-table"
import type { SearchFiltersState, ToolbarButtonConfig, FilterFieldConfig, StatusOption } from "@/components/common/toolbar-with-filters"
import {
  IconPlus,
  IconRefresh,
  IconKey,
} from "@tabler/icons-react"
import { toast } from "sonner"

const defaultFilters: SearchFiltersState = {
  keyword: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
}

type User = {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

export default function UsersPage() {
  const t = useTranslations("dashboard.userManagement")
  const [page, setPage] = React.useState(1)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<string | null>(null)
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false)
  const [changingPasswordUserId, setChangingPasswordUserId] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<SearchFiltersState>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<SearchFiltersState>(defaultFilters)

  const { data, isLoading, isFetching, refetch } = trpc.getUsers.useQuery({
    page,
    pageSize: 10,
    search: appliedFilters.keyword || undefined,
    status: appliedFilters.status && appliedFilters.status !== "all" ? (appliedFilters.status as "active" | "inactive") : undefined,
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

  const handleDelete = (user: User) => {
    deleteUserMutation.mutate({ id: user.id })
  }

  const handleToggleStatus = (user: User) => {
    toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive })
  }

  const handleEdit = (user: User) => {
    setEditingUser(user.id)
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

  const handleChangePassword = (user: User) => {
    setChangingPasswordUserId(user.id)
    setChangePasswordOpen(true)
  }

  const handleChangePasswordClose = () => {
    setChangePasswordOpen(false)
    setChangingPasswordUserId(null)
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
    }
  ]

  const statusOptions: StatusOption[] = [
    { value: "all", label: t("filters.statusAll") },
    { value: "active", label: t("filters.statusActive") },
    { value: "inactive", label: t("filters.statusInactive") },
  ]

  const filterFields: FilterFieldConfig[] = [
    {
      type: "date",
      key: "dateFrom",
      label: t("filters.dateFrom"),
    },
    {
      type: "date",
      key: "dateTo",
      label: t("filters.dateTo"),
    },
    {
      type: "select",
      key: "status",
      label: t("filters.status"),
      options: statusOptions,
    },
  ]

  const toolbarLabels = {
    keywordPlaceholder: t("filters.keywordPlaceholder"),
    search: t("filters.search"),
  }

  const columns: CrudTableColumn<User>[] = [
    {
      key: "name",
      header: t("name"),
      accessor: (user) => <span className="font-medium">{user.name}</span>,
    },
    {
      key: "email",
      header: t("email"),
      accessor: (user) => user.email,
    },
    {
      key: "status",
      header: t("status"),
      accessor: (user) => (
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? t("active") : t("inactive")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      accessor: (user) => (
        user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "--"
      ),
    },
  ]

  return (
    <>
      <CrudTable
        data={data?.users}
        isLoading={isLoading}
        isFetching={isFetching}
        columns={columns}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        toolbarLabels={toolbarLabels}
        filterFields={filterFields}
        toolbarButtons={toolbarButtons}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        getRowId={(user) => user.id}
        getRowStatus={(user) => ({
          isActive: user.isActive,
          label: user.isActive ? t("disableUser") : t("enableUser"),
        })}
        customActions={(user) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleChangePassword(user)}
            title={t("changePassword")}
          >
            <IconKey className="h-4 w-4" />
          </Button>
        )}
        emptyMessage={t("noUsers")}
      />

      <UserManagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        userId={editingUser}
        onSuccess={handleDrawerClose}
      />

      {changingPasswordUserId && (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          userId={changingPasswordUserId}
          onSuccess={handleChangePasswordClose}
        />
      )}
    </>
  )
}
