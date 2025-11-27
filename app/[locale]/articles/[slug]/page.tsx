import { createCaller } from "@/server/trpc/server"
import { Badge } from "@/components/ui/badge"
import { ArticleContentServer } from "@/components/article/article-content-server"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

interface ArticleDetailPageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const api = await createCaller()
  const article = await api.getArticleBySlug({ slug })
  if (!article) {
    return {
      title: "Article Not Found",
    }
  }

  const isZh = locale === "zh"
  const metaTitle = isZh 
    ? (article.metaTitleZh || article.titleZh)
    : (article.metaTitleEn || article.titleEn)
  const metaDescription = isZh
    ? (article.metaDescriptionZh || article.contentZh.replace(/<[^>]*>/g, "").substring(0, 160))
    : (article.metaDescriptionEn || article.contentEn.replace(/<[^>]*>/g, "").substring(0, 160))
  const metaKeywords = isZh ? (article.metaKeywordsZh || "") : (article.metaKeywordsEn || "")
  const ogImage = article.ogImage || ""

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords || undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { slug, locale } = await params
  const api = await createCaller()
  const article = await api.getArticleBySlug({ slug })

  if (!article) {
    notFound()
  }

  const isZh = locale === "zh"
  const title = isZh ? article.titleZh : article.titleEn
  const content = isZh ? article.contentZh : article.contentEn
  const categoryName = isZh ? article.categoryNameZh : article.categoryNameEn

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {article.createdAt
              ? new Date(article.createdAt).toLocaleDateString()
              : "--"}
          </span>
          {article.categoryId && categoryName && (
            <Badge variant="outline">{categoryName}</Badge>
          )}
        </div>
      </div>

      <ArticleContentServer content={content} />
    </article>
  )
}
