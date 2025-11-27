"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { IconX } from "@tabler/icons-react"

interface ImagePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  imageName: string
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  imageName,
}: ImagePreviewDialogProps) {
  const [imageError, setImageError] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setImageError(false)
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-4xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="truncate pr-4">{imageName}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-muted/30">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>无法加载图片</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

