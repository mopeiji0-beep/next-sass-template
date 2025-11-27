"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TipTapEditor } from "@/components/article/tiptap-editor"
import { SeoConfig } from "@/components/article/seo-config"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"

export default function EditArticlePage() {
  const t = useTranslations("dashboard.articleManagement")
  const params = useParams()
  const router = useRouter()
  const articleId = params.id as string
  const locale = params.locale as string
  const isNew = articleId === "new"

  const [titleZh, setTitleZh] = React.useState("")
  const [titleEn, setTitleEn] = React.useState("")
  const [contentZh, setContentZh] = React.useState("")
  const [contentEn, setContentEn] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string>("none")
  const [isPublished, setIsPublished] = React.useState(false)
  const [metaTitleZh, setMetaTitleZh] = React.useState("")
  const [metaTitleEn, setMetaTitleEn] = React.useState("")
  const [metaDescriptionZh, setMetaDescriptionZh] = React.useState("")
  const [metaDescriptionEn, setMetaDescriptionEn] = React.useState("")
  const [metaKeywordsZh, setMetaKeywordsZh] = React.useState("")
  const [metaKeywordsEn, setMetaKeywordsEn] = React.useState("")
  const [ogImage, setOgImage] = React.useState("")

  const { data: categories } = trpc.getCategories.useQuery({ pageSize: 100 })

  const { data: articleData, isLoading } = trpc.getArticleById.useQuery(
    { id: articleId },
    { enabled: !isNew }
  )

  const createArticleMutation = trpc.createArticle.useMutation({
    onSuccess: () => {
      toast.success(t("createSuccess"))
      router.push(`/${locale}/dashboard/articles`)
    },
    onError: (error) => {
      toast.error(error.message || t("errors.createFailed"))
    },
  })

  const updateArticleMutation = trpc.updateArticle.useMutation({
    onSuccess: () => {
      toast.success(t("updateSuccess"))
      router.push(`/${locale}/dashboard/articles`)
    },
    onError: (error) => {
      toast.error(error.message || t("errors.updateFailed"))
    },
  })

  React.useEffect(() => {
    if (articleData && !isNew) {
      setTitleZh(articleData.titleZh)
      setTitleEn(articleData.titleEn)
      setContentZh(articleData.contentZh)
      setContentEn(articleData.contentEn)
      setSlug(articleData.slug)
      setCategoryId(articleData.categoryId || "none")
      setIsPublished(articleData.isPublished)
      setMetaTitleZh(articleData.metaTitleZh || "")
      setMetaTitleEn(articleData.metaTitleEn || "")
      setMetaDescriptionZh(articleData.metaDescriptionZh || "")
      setMetaDescriptionEn(articleData.metaDescriptionEn || "")
      setMetaKeywordsZh(articleData.metaKeywordsZh || "")
      setMetaKeywordsEn(articleData.metaKeywordsEn || "")
      setOgImage(articleData.ogImage || "")
    }
  }, [articleData, isNew])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!titleZh || !titleEn || !contentZh || !contentEn || !slug) {
      toast.error(t("errors.requiredFields"))
      return
    }

    const data = {
      titleZh,
      titleEn,
      contentZh,
      contentEn,
      slug,
      categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
      isPublished,
      metaTitleZh: metaTitleZh || undefined,
      metaTitleEn: metaTitleEn || undefined,
      metaDescriptionZh: metaDescriptionZh || undefined,
      metaDescriptionEn: metaDescriptionEn || undefined,
      metaKeywordsZh: metaKeywordsZh || undefined,
      metaKeywordsEn: metaKeywordsEn || undefined,
      ogImage: ogImage || undefined,
    }

    if (isNew) {
      createArticleMutation.mutate(data)
    } else {
      updateArticleMutation.mutate({
        id: articleId,
        ...data,
      })
    }
  }

  const isPending = createArticleMutation.isPending || updateArticleMutation.isPending
  const isLoadingData = Boolean(isLoading && !isNew)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? t("createArticle") : t("editArticle")}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titleZh">{t("titleZh")}</Label>
            <Input
              id="titleZh"
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              required
              disabled={isPending || isLoadingData}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="titleEn">{t("titleEn")}</Label>
            <Input
              id="titleEn"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              required
              disabled={isPending || isLoadingData}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              required
              disabled={isPending || isLoadingData}
              placeholder="article-slug"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{t("category")}</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isPending || isLoadingData}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noCategory")}</SelectItem>
                {categories?.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nameZh} / {cat.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingData ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <Tabs defaultValue="zh" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="zh">{t("chinese")}</TabsTrigger>
              <TabsTrigger value="en">{t("english")}</TabsTrigger>
            </TabsList>
            <TabsContent value="zh" className="space-y-2">
              <Label>{t("contentZh")}</Label>
              <TipTapEditor
                content={contentZh}
                onChange={setContentZh}
                placeholder={t("contentPlaceholder")}
                editable={!isPending}
              />
            </TabsContent>
            <TabsContent value="en" className="space-y-2">
              <Label>{t("contentEn")}</Label>
              <TipTapEditor
                content={contentEn}
                onChange={setContentEn}
                placeholder={t("contentPlaceholder")}
                editable={!isPending}
              />
            </TabsContent>
          </Tabs>
        )}

        <div className="border rounded-lg p-4">
          <SeoConfig
            metaTitleZh={metaTitleZh}
            metaTitleEn={metaTitleEn}
            metaDescriptionZh={metaDescriptionZh}
            metaDescriptionEn={metaDescriptionEn}
            metaKeywordsZh={metaKeywordsZh}
            metaKeywordsEn={metaKeywordsEn}
            ogImage={ogImage}
            onMetaTitleZhChange={setMetaTitleZh}
            onMetaTitleEnChange={setMetaTitleEn}
            onMetaDescriptionZhChange={setMetaDescriptionZh}
            onMetaDescriptionEnChange={setMetaDescriptionEn}
            onMetaKeywordsZhChange={setMetaKeywordsZh}
            onMetaKeywordsEnChange={setMetaKeywordsEn}
            onOgImageChange={setOgImage}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            disabled={isPending || isLoadingData}
            className="rounded"
          />
          <Label htmlFor="isPublished" className="cursor-pointer">
            {t("publish")}
          </Label>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isPending || isLoadingData}
          >
            {isPending ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loading")}
              </>
            ) : (
              isNew ? t("create") : t("update")
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

