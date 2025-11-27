"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import { ToolbarWithFilters, type SearchFiltersState, type ToolbarButtonConfig, type FilterFieldConfig } from "@/components/common/toolbar-with-filters"
import {
  IconEdit,
  IconTrash,
  IconLoader2,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react"
import { toast } from "sonner"

export interface CrudTableColumn<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  className?: string
}

export interface CrudTableProps<T> {
  // Data
  data?: T[]
  isLoading?: boolean
  isFetching?: boolean
  columns: CrudTableColumn<T>[]
  
  // Pagination
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  pageLabel?: string
  
  // Search & Filters
  filters?: SearchFiltersState
  onFiltersChange?: (filters: SearchFiltersState) => void
  onSearch?: () => void
  filterFields?: FilterFieldConfig[]
  toolbarLabels?: {
    keywordPlaceholder: string
    search: string
  }
  
  // Toolbar Actions
  toolbarButtons?: ToolbarButtonConfig[]
  
  // Row Actions
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onToggleStatus?: (row: T) => void
  getRowId: (row: T) => string
  getRowStatus?: (row: T) => { isActive: boolean; label: string }
  customActions?: (row: T) => React.ReactNode
  
  // Empty State
  emptyMessage?: string
  
  // Loading State
  loadingRows?: number
}

export function CrudTable<T extends Record<string, unknown>>({
  data = [],
  isLoading = false,
  isFetching = false,
  columns,
  page = 1,
  totalPages = 1,
  onPageChange,
  pageLabel,
  filters,
  onFiltersChange,
  onSearch,
  filterFields,
  toolbarLabels,
  toolbarButtons = [],
  onEdit,
  onDelete,
  onToggleStatus,
  getRowId,
  getRowStatus,
  customActions,
  emptyMessage,
  loadingRows = 5,
}: CrudTableProps<T>) {
  const t = useTranslations("dashboard.userManagement")
  
  const isInitialLoading = isLoading && !data
  const isRefetching = isFetching && !!data

  const handleDelete = (row: T) => {
    if (onDelete && confirm(t("deleteConfirm"))) {
      onDelete(row)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col gap-4">
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
          {[...Array(loadingRows)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {(toolbarButtons.length > 0 || filters) && (
        <ToolbarWithFilters
          buttons={toolbarButtons}
          filters={filters!}
          onFiltersChange={onFiltersChange!}
          onSearch={onSearch || (() => {})}
          labels={toolbarLabels || {
            keywordPlaceholder: "",
            search: "",
          }}
          filterFields={filterFields}
          isSearching={isFetching && !isLoading}
        />
      )}

      <div className="relative rounded-md border">
        {isRefetching && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
            <IconLoader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {(onEdit || onDelete || onToggleStatus || customActions) && (
                <TableHead className="text-right">{t("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onEdit || onDelete || onToggleStatus || customActions ? 1 : 0)} className="text-center text-muted-foreground">
                  {emptyMessage || t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={getRowId(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.accessor(row)}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onToggleStatus || customActions) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(row)}
                            title={t("edit")}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        )}
                        {customActions && customActions(row)}
                        {onToggleStatus && getRowStatus && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleStatus(row)}
                            title={getRowStatus(row).label}
                          >
                            {getRowStatus(row).isActive ? (
                              <IconUserX className="h-4 w-4" />
                            ) : (
                              <IconUserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(row)}
                            title={t("delete")}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pageLabel || t("page")} {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

