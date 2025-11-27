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
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface CategoryManagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId?: string | null
  onSuccess?: () => void
}

export function CategoryManagementDrawer({
  open,
  onOpenChange,
  categoryId,
  onSuccess,
}: CategoryManagementDrawerProps) {
  const t = useTranslations("dashboard.articleCategoryManagement")
  const [nameZh, setNameZh] = React.useState("")
  const [nameEn, setNameEn] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [descriptionZh, setDescriptionZh] = React.useState("")
  const [descriptionEn, setDescriptionEn] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState("0")

  const { data: categoryData, isLoading } = trpc.getCategoryById.useQuery(
    { id: categoryId! },
    { enabled: !!categoryId && open }
  )

  const createCategoryMutation = trpc.createCategory.useMutation({
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

  const updateCategoryMutation = trpc.updateCategory.useMutation({
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
    setNameZh("")
    setNameEn("")
    setSlug("")
    setDescriptionZh("")
    setDescriptionEn("")
    setSortOrder("0")
  }

  React.useEffect(() => {
    if (categoryData && open) {
      setNameZh(categoryData.nameZh)
      setNameEn(categoryData.nameEn)
      setSlug(categoryData.slug)
      setDescriptionZh(categoryData.descriptionZh || "")
      setDescriptionEn(categoryData.descriptionEn || "")
      setSortOrder(categoryData.sortOrder)
    } else if (!categoryId && open) {
      resetForm()
    }
  }, [categoryData, open, categoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nameZh || !nameEn || !slug) {
      toast.error(t("errors.requiredFields"))
      return
    }

    const data = {
      nameZh,
      nameEn,
      slug,
      descriptionZh: descriptionZh || undefined,
      descriptionEn: descriptionEn || undefined,
      sortOrder,
    }

    if (categoryId) {
      updateCategoryMutation.mutate({
        id: categoryId,
        ...data,
      })
    } else {
      createCategoryMutation.mutate(data)
    }
  }

  const isLoadingData = Boolean(isLoading && categoryId)
  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{categoryId ? t("editCategory") : t("createCategory")}</SheetTitle>
            <SheetDescription>
              {categoryId ? t("editCategoryDescription") : t("createCategoryDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4 flex-1 overflow-y-auto">
            {isLoadingData ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nameZh">{t("nameZh")}</Label>
                  <Input
                    id="nameZh"
                    value={nameZh}
                    onChange={(e) => setNameZh(e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t("nameEn")}</Label>
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t("slug")}</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    required
                    disabled={isPending}
                    placeholder="category-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionZh">{t("descriptionZh")}</Label>
                  <Textarea
                    id="descriptionZh"
                    value={descriptionZh}
                    onChange={(e) => setDescriptionZh(e.target.value)}
                    disabled={isPending}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t("descriptionEn")}</Label>
                  <Textarea
                    id="descriptionEn"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    disabled={isPending}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    disabled={isPending}
                  />
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
                : categoryId
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

