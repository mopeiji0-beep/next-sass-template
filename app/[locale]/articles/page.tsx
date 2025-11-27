import { getTranslations } from "next-intl/server"
import { createCaller } from "@/server/trpc/server"
import { ArticlesListClient } from "./articles-list-client"

interface ArticlesPageProps {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    page?: string
    categoryId?: string
  }>
}

export default async function ArticlesListPage({ params, searchParams }: ArticlesPageProps) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const t = await getTranslations("articles")
  const page = parseInt(resolvedSearchParams.page || "1", 10)
  const categoryId = resolvedSearchParams.categoryId || undefined

  const api = await createCaller()
  const [articlesData, categoriesData] = await Promise.all([
    api.getPublishedArticles({
      page,
      pageSize: 12,
      categoryId,
    }),
    api.getCategories({ pageSize: 100 }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <ArticlesListClient
        initialData={articlesData}
        categories={categoriesData.categories}
        currentPage={page}
        currentCategoryId={categoryId}
        locale={locale}
      />
    </div>
  )
}
