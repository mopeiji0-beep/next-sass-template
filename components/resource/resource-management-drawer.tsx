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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ResourceManagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceId?: string | null
  onSuccess?: () => void
}

export function ResourceManagementDrawer({
  open,
  onOpenChange,
  resourceId,
  onSuccess,
}: ResourceManagementDrawerProps) {
  const t = useTranslations("dashboard.resourceManagement")
  const [directory, setDirectory] = React.useState<"root" | "upload">("upload")

  const { data: resourceData, isLoading } = trpc.getResourceById.useQuery(
    { id: resourceId! },
    { enabled: !!resourceId && open }
  )

  const updateResourceMutation = trpc.updateResource.useMutation({
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
    setDirectory("upload")
  }

  React.useEffect(() => {
    if (resourceData && open) {
      setDirectory(resourceData.directory)
    } else if (!resourceId && open) {
      resetForm()
    }
  }, [resourceData, open, resourceId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!resourceId) {
      return
    }

    updateResourceMutation.mutate({
      id: resourceId,
      directory,
    })
  }

  const isLoadingData = Boolean(isLoading && resourceId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{t("editResource")}</SheetTitle>
            <SheetDescription>
              {t("editResourceDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4">
            {isLoadingData ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="directory">{t("directory")}</Label>
                  <Select
                    value={directory}
                    onValueChange={(value) => setDirectory(value as "root" | "upload")}
                    disabled={updateResourceMutation.isPending}
                  >
                    <SelectTrigger id="directory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">{t("rootDirectory")}</SelectItem>
                      <SelectItem value="upload">{t("uploadDirectory")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {resourceData && (
                  <div className="space-y-2">
                    <Label>{t("fileInfo")}</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{t("fileName")}: {resourceData.fileName}</p>
                      <p>{t("fileSize")}: {(parseInt(resourceData.fileSize) / 1024).toFixed(2)} KB</p>
                      <p>{t("mimeType")}: {resourceData.mimeType}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <SheetFooter>
            <Button
              type="submit"
              disabled={updateResourceMutation.isPending || isLoadingData || !resourceId}
            >
              {updateResourceMutation.isPending
                ? t("loading")
                : t("update")}
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

