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
import { toast } from "sonner"
import { IconUpload, IconLoader2 } from "@tabler/icons-react"

interface ResourceUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ResourceUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: ResourceUploadDialogProps) {
  const t = useTranslations("dashboard.resourceManagement")
  const [file, setFile] = React.useState<File | null>(null)
  const [directory, setDirectory] = React.useState<"root" | "upload">("upload")
  const [isUploading, setIsUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const createResourceMutation = trpc.createResource.useMutation({
    onSuccess: () => {
      toast.success(t("uploadSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || t("errors.uploadFailed"))
    },
  })

  const resetForm = () => {
    // 清理之前的预览 URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setDirectory("upload")
    setIsUploading(false)
    setPreviewUrl(null)
  }

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith("image/")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // 清理之前的预览 URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      
      setFile(selectedFile)
      
      // 如果是图片，创建预览 URL
      if (isImage(selectedFile.type)) {
        const url = URL.createObjectURL(selectedFile)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  // 组件卸载时清理预览 URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error(t("errors.noFileSelected"))
      return
    }

    setIsUploading(true)

    try {
      // 上传文件
      const formData = new FormData()
      formData.append("file", file)
      formData.append("directory", directory)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || "Upload failed")
      }

      const uploadData = await uploadResponse.json()

      // 创建资源记录
      createResourceMutation.mutate({
        fileName: uploadData.data.fileName,
        filePath: uploadData.data.filePath,
        fileSize: uploadData.data.fileSize,
        mimeType: uploadData.data.mimeType,
        directory: uploadData.data.directory,
      })
    } catch (error) {
      toast.error((error as Error).message || t("errors.uploadFailed"))
      setIsUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{t("uploadResource")}</SheetTitle>
            <SheetDescription>
              {t("uploadResourceDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4 flex-1 overflow-auto">
            <div className="space-y-2">
              <Label htmlFor="file">{t("file")}</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
                disabled={isUploading || createResourceMutation.isPending}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="directory">{t("directory")}</Label>
              <Select
                value={directory}
                onValueChange={(value) => setDirectory(value as "root" | "upload")}
                disabled={isUploading || createResourceMutation.isPending}
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
            {previewUrl && (
              <div className="space-y-2">
                <Label>{t("preview")}</Label>
                <div className="relative w-full rounded-md overflow-hidden border bg-muted">
                  <img
                    src={previewUrl}
                    alt={file?.name || "Preview"}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button
              type="submit"
              disabled={!file || isUploading || createResourceMutation.isPending}
            >
              {(isUploading || createResourceMutation.isPending) ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("uploading")}
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 h-4 w-4" />
                  {t("upload")}
                </>
              )}
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

