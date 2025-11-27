"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ResourceUploadDialog } from "@/components/resource/resource-upload-dialog"
import { ResourceManagementDrawer } from "@/components/resource/resource-management-drawer"
import { CrudTable, type CrudTableColumn } from "@/components/common/crud-table"
import type { SearchFiltersState, ToolbarButtonConfig } from "@/components/common/toolbar-with-filters"
import {
  IconPlus,
  IconRefresh,
  IconDownload,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { ImagePreviewDialog } from "@/components/resource/image-preview-dialog"

const defaultFilters: SearchFiltersState = {
  keyword: "",
}

type Resource = {
  id: string
  fileName: string
  filePath: string
  fileSize: string
  mimeType: string
  directory: "root" | "upload"
  uploadedBy: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export default function ResourcesPage() {
  const t = useTranslations("dashboard.resourceManagement")
  const [page, setPage] = React.useState(1)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editingResource, setEditingResource] = React.useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<{ url: string; name: string } | null>(null)
  const [filters, setFilters] = React.useState<SearchFiltersState>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<SearchFiltersState>(defaultFilters)
  const [directoryFilter, setDirectoryFilter] = React.useState<"root" | "upload" | "all">("all")

  const { data, isLoading, isFetching, refetch } = trpc.getResources.useQuery({
    page,
    pageSize: 10,
    search: appliedFilters.keyword || undefined,
    directory: directoryFilter !== "all" ? directoryFilter : undefined,
  })

  const deleteResourceMutation = trpc.deleteResource.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"))
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.deleteFailed"))
    },
  })

  const handleDelete = (resource: Resource) => {
    deleteResourceMutation.mutate({ id: resource.id })
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource.id)
    setDrawerOpen(true)
  }

  const handleUpload = () => {
    setUploadDialogOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingResource(null)
    refetch()
  }

  const handleUploadClose = () => {
    setUploadDialogOpen(false)
    refetch()
  }

  const handleSearch = () => {
    setPage(1)
    setAppliedFilters(filters)
  }

  const handleDownload = (resource: Resource) => {
    const link = document.createElement("a")
    link.href = `/${resource.filePath}`
    link.download = resource.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith("image/")
  }

  const handlePreview = (resource: Resource) => {
    if (isImage(resource.mimeType)) {
      setPreviewImage({
        url: `/${resource.filePath}`,
        name: resource.fileName,
      })
      setPreviewOpen(true)
    }
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
      key: "upload",
      label: t("actionsBar.upload"),
      icon: IconPlus,
      onClick: handleUpload,
    }
  ]

  const columns: CrudTableColumn<Resource>[] = [
    {
      key: "fileName",
      header: t("fileName"),
      accessor: (resource) => (
        <div className="flex items-center gap-3">
          {isImage(resource.mimeType) ? (
            <>
              <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted cursor-pointer group flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/${resource.filePath}`}
                  alt={resource.fileName}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  onClick={() => handlePreview(resource)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-xs text-muted-foreground">图片</span></div>'
                    }
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">{resource.fileName}</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-md border flex items-center justify-center bg-muted flex-shrink-0">
                <span className="text-xs text-muted-foreground">文件</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium truncate">{resource.fileName}</span>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: "directory",
      header: t("directory"),
      accessor: (resource) => (
        <Badge variant="outline">
          {resource.directory === "root" ? t("rootDirectory") : t("uploadDirectory")}
        </Badge>
      ),
    },
    {
      key: "fileSize",
      header: t("fileSize"),
      accessor: (resource) => `${(parseInt(resource.fileSize) / 1024).toFixed(2)} KB`,
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      accessor: (resource) =>
        resource.createdAt
          ? new Date(resource.createdAt).toLocaleDateString()
          : "--",
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Select
          value={directoryFilter}
          onValueChange={(value) => {
            setDirectoryFilter(value as "root" | "upload" | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allDirectories")}</SelectItem>
            <SelectItem value="root">{t("rootDirectory")}</SelectItem>
            <SelectItem value="upload">{t("uploadDirectory")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CrudTable
        data={data?.resources}
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
        getRowId={(resource) => resource.id}
        customActions={(resource) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(resource)}
            title={t("download")}
          >
            <IconDownload className="h-4 w-4" />
          </Button>
        )}
        emptyMessage={t("noResources")}
      />

      <ResourceUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadClose}
      />

      <ResourceManagementDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        resourceId={editingResource}
        onSuccess={handleDrawerClose}
      />

      {previewImage && (
        <ImagePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          imageUrl={previewImage.url}
          imageName={previewImage.name}
        />
      )}
    </div>
  )
}

