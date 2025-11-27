"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CrudTable, type CrudTableColumn } from "@/components/common/crud-table"
import type { SearchFiltersState, ToolbarButtonConfig } from "@/components/common/toolbar-with-filters"
import {
  IconPlus,
  IconRefresh,
  IconDownload,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react"
import { toast } from "sonner"

const defaultFilters: SearchFiltersState = {
  keyword: "",
}

type Article = {
  id: string
  titleZh: string
  titleEn: string
  contentZh: string
  contentEn: string
  slug: string
  categoryId: string | null
  authorId: string | null
  isPublished: boolean
  publishedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

export default function ArticlesPage() {
  const t = useTranslations("dashboard.articleManagement")
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<SearchFiltersState>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<SearchFiltersState>(defaultFilters)

  const { data, isLoading, isFetching, refetch } = trpc.getArticles.useQuery({
    page,
    pageSize: 10,
    search: appliedFilters.keyword || undefined,
  })

  const deleteArticleMutation = trpc.deleteArticle.useMutation({
    onSuccess: () => {
      toast.success(t("deleteSuccess"))
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.deleteFailed"))
    },
  })

  const togglePublishMutation = trpc.toggleArticlePublishStatus.useMutation({
    onSuccess: () => {
      toast.success(t("togglePublishSuccess"))
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.togglePublishFailed"))
    },
  })

  const handleDelete = (article: Article) => {
    deleteArticleMutation.mutate({ id: article.id })
  }

  const handleEdit = (article: Article) => {
    router.push(`/${locale}/dashboard/articles/${article.id}/edit`)
  }

  const handleAdd = () => {
    router.push(`/${locale}/dashboard/articles/new/edit`)
  }


  const handleSearch = () => {
    setPage(1)
    setAppliedFilters(filters)
  }

  const handlePublish = (article: Article) => {
    if (!article.isPublished) {
      togglePublishMutation.mutate({ id: article.id })
    }
  }

  const handleUnpublish = (article: Article) => {
    if (article.isPublished) {
      togglePublishMutation.mutate({ id: article.id })
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
      key: "create",
      label: t("actionsBar.create"),
      icon: IconPlus,
      onClick: handleAdd,
    }
  ]

  const columns: CrudTableColumn<Article>[] = [
    {
      key: "title",
      header: t("title"),
      accessor: (article) => (
        <div className="flex flex-col">
          <span className="font-medium">{article.titleZh}</span>
          <span className="text-xs text-muted-foreground">{article.titleEn}</span>
        </div>
      ),
    },
    {
      key: "slug",
      header: t("slug"),
      accessor: (article) => (
        <span className="text-muted-foreground text-sm">{article.slug}</span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      accessor: (article) => (
        <Badge variant={article.isPublished ? "default" : "secondary"}>
          {article.isPublished ? t("published") : t("draft")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      accessor: (article) =>
        article.createdAt
          ? new Date(article.createdAt).toLocaleDateString()
          : "--",
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-6">
      <CrudTable
        data={data?.articles}
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
        getRowId={(article) => article.id}
        customActions={(article) => (
          <>
            {article.isPublished ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnpublish(article)}
                title={t("unpublish")}
                disabled={togglePublishMutation.isPending}
              >
                <IconWorldOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePublish(article)}
                title={t("publish")}
                disabled={togglePublishMutation.isPending}
              >
                <IconWorld className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        emptyMessage={t("noArticles")}
      />
    </div>
  )
}

