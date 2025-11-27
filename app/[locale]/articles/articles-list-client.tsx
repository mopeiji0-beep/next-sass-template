"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ArticlesListClientProps {
  initialData: {
    articles: Array<{
      id: string
      titleZh: string
      titleEn: string
      contentZh: string
      contentEn: string
      slug: string
      categoryId: string | null
      createdAt: Date | null
    }>
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  categories: Array<{
    id: string
    nameZh: string
    nameEn: string
  }>
  currentPage: number
  currentCategoryId?: string
  locale: string
}

export function ArticlesListClient({
  initialData,
  categories,
  currentPage,
  currentCategoryId,
  locale,
}: ArticlesListClientProps) {
  const t = useTranslations("articles")
  const router = useRouter()
  const searchParams = useSearchParams()
  const isZh = locale === "zh"

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId === "all") {
      params.delete("categoryId")
    } else {
      params.set("categoryId", categoryId)
    }
    params.set("page", "1")
    router.push(`/articles?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`/articles?${params.toString()}`)
  }

  return (
    <>
      <div className="mb-6">
        <Select
          value={currentCategoryId || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {isZh ? cat.nameZh : cat.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {initialData.articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("noArticles")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialData.articles.map((article) => {
              const title = isZh ? article.titleZh : article.titleEn
              const content = isZh ? article.contentZh : article.contentEn
              return (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="block border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                  </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {article.createdAt
                      ? new Date(article.createdAt).toLocaleDateString()
                      : "--"}
                  </span>
                  <Badge variant="outline">{t("readMore")}</Badge>
                </div>
              </Link>
              )
            })}
          </div>

          {initialData.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t("previous")}
              </Button>
              <span className="flex items-center px-4">
                {t("page")} {currentPage} / {initialData.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(Math.min(initialData.totalPages, currentPage + 1))}
                disabled={currentPage === initialData.totalPages}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

