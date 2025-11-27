"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc/client"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Skeleton } from "@/components/ui/skeleton"
import { TipTapEditor } from "@/components/article/tiptap-editor"
import { toast } from "sonner"

interface ArticleManagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: string | null
  onSuccess?: () => void
}

export function ArticleManagementDrawer({
  open,
  onOpenChange,
  articleId,
  onSuccess,
}: ArticleManagementDrawerProps) {
  const t = useTranslations("dashboard.articleManagement")
  const [titleZh, setTitleZh] = React.useState("")
  const [titleEn, setTitleEn] = React.useState("")
  const [contentZh, setContentZh] = React.useState("")
  const [contentEn, setContentEn] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string>("none")
  const [isPublished, setIsPublished] = React.useState(false)

  const { data: categories } = trpc.getCategories.useQuery({ pageSize: 100 })

  const { data: articleData, isLoading } = trpc.getArticleById.useQuery(
    { id: articleId! },
    { enabled: !!articleId && open }
  )

  const createArticleMutation = trpc.createArticle.useMutation({
    onSuccess: () => {
      toast.success(t("createSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.createFailed"))
    },
  })

  const updateArticleMutation = trpc.updateArticle.useMutation({
    onSuccess: () => {
      toast.success(t("updateSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.updateFailed"))
    },
  })

  const resetForm = () => {
    setTitleZh("")
    setTitleEn("")
    setContentZh("")
    setContentEn("")
    setSlug("")
    setCategoryId("none")
    setIsPublished(false)
  }

  React.useEffect(() => {
    if (articleData && open) {
      setTitleZh(articleData.titleZh)
      setTitleEn(articleData.titleEn)
      setContentZh(articleData.contentZh)
      setContentEn(articleData.contentEn)
      setSlug(articleData.slug)
      setCategoryId(articleData.categoryId || "none")
      setIsPublished(articleData.isPublished)
    } else if (!articleId && open) {
      resetForm()
    }
  }, [articleData, open, articleId])

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
    }

    if (articleId) {
      updateArticleMutation.mutate({
        id: articleId,
        ...data,
      })
    } else {
      createArticleMutation.mutate(data)
    }
  }

  const isLoadingData = Boolean(isLoading && articleId)
  const isPending = createArticleMutation.isPending || updateArticleMutation.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-4xl overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{articleId ? t("editArticle") : t("createArticle")}</SheetTitle>
            <SheetDescription>
              {articleId ? t("editArticleDescription") : t("createArticleDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4 flex-1 overflow-y-auto">
            {isLoadingData ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titleZh">{t("titleZh")}</Label>
                    <Input
                      id="titleZh"
                      value={titleZh}
                      onChange={(e) => setTitleZh(e.target.value)}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">{t("titleEn")}</Label>
                    <Input
                      id="titleEn"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      required
                      disabled={isPending}
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
                      disabled={isPending}
                      placeholder="article-slug"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("category")}</Label>
                    <Select
                      value={categoryId}
                      onValueChange={setCategoryId}
                      disabled={isPending}
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    disabled={isPending}
                    className="rounded"
                  />
                  <Label htmlFor="isPublished" className="cursor-pointer">
                    {t("publish")}
                  </Label>
                </div>
              </>
            )}
          </div>
          <SheetFooter>
            <Button
              type="submit"
              disabled={isPending || isLoadingData}
            >
              {isPending
                ? t("loading")
                : articleId
                ? t("update")
                : t("create")}
            </Button>
            <SheetClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

