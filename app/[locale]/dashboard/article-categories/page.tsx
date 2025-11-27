"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { CrudTable, type CrudTableColumn } from "@/components/common/crud-table"
import type { SearchFiltersState, ToolbarButtonConfig } from "@/components/common/toolbar-with-filters"
import {
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { CategoryManagementDrawer } from "@/components/article/category-management-drawer"

const defaultFilters: SearchFiltersState = {
  keyword: "",
}

type Category = {
  id: string
  nameZh: string
  nameEn: string
  slug: string
  descriptionZh: string | null
  descriptionEn: string | null
  sortOrder: string
  createdAt: Date | null
  updatedAt: Date | null
}

export default function ArticleCategoriesPage() {
  const t = useTranslations("dashboard.articleCategoryManagement")
  const [page, setPage] = React.useState(1)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<SearchFiltersState>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<SearchFiltersState>(defaultFilters)

  const { data, isLoading, isFetching, refetch } = trpc.getCategories.useQuery({
    page,
    pageSize: 10,
    search: appliedFilters.keyword || undefined,
  })

  const deleteCategoryMutation = trpc.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"))
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.deleteFailed"))
    },
  })

  const handleDelete = (category: Category) => {
    deleteCategoryMutation.mutate({ id: category.id })
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category.id)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingCategory(null)
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

  const columns: CrudTableColumn<Category>[] = [
    {
      key: "name",
      header: t("name"),
      accessor: (category) => (
        <div className="flex flex-col">
          <span className="font-medium">{category.nameZh}</span>
          <span className="text-xs text-muted-foreground">{category.nameEn}</span>
        </div>
      ),
    },
    {
      key: "slug",
      header: t("slug"),
      accessor: (category) => (
        <span className="text-muted-foreground text-sm">{category.slug}</span>
      ),
    },
    {
      key: "sortOrder",
      header: t("sortOrder"),
      accessor: (category) => category.sortOrder,
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      accessor: (category) =>
        category.createdAt
          ? new Date(category.createdAt).toLocaleDateString()
          : "--",
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-6">
      <CrudTable
        data={data?.categories}
        isLoading={isLoading}
        isFetching={isFetching}
        columns={columns}
        page={data?.page || page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        toolbarLabels={{
          keywordPlaceholder: t("filters.keywordPlaceholder"),
          search: t("filters.search"),
        }}
        filterFields={[]}
        toolbarButtons={toolbarButtons}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(category) => category.id}
        emptyMessage={t("noCategories")}
      />

      <CategoryManagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categoryId={editingCategory}
        onSuccess={handleDrawerClose}
      />
    </div>
  )
}

