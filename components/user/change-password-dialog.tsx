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
import { toast } from "sonner"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  isCurrentUser?: boolean
  onSuccess?: () => void
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
  isCurrentUser = false,
  onSuccess,
}: ChangePasswordDialogProps) {
  const tUserManagement = useTranslations("dashboard.userManagement")
  const tSettings = useTranslations("dashboard.settings")
  const t = tSettings
  const tErrors = useTranslations("auth.errors")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const changeUserPasswordMutation = trpc.changeUserPassword.useMutation({
    onSuccess: () => {
      toast.success(t("changePasswordSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        ""
      toast.error(errorMessage || t("errors.changePasswordFailed"))
    },
  })

  const changeCurrentUserPasswordMutation = trpc.changeCurrentUserPassword.useMutation({
    onSuccess: () => {
      toast.success(t("changePasswordSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        ""
      if (errorMessage.includes("incorrect")) {
        toast.error(t("errors.incorrectCurrentPassword"))
      } else {
        toast.error(errorMessage || t("errors.changePasswordFailed"))
      }
    },
  })

  const resetForm = () => {
    setCurrentPassword("")
    setPassword("")
    setConfirmPassword("")
  }

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isCurrentUser) {
      // 当前用户修改密码需要验证当前密码
      if (!currentPassword) {
        toast.error(tSettings("errors.currentPasswordRequired"))
        return
      }
    }

    if (!password || password.length < 6) {
      toast.error(tErrors("passwordTooShort"))
      return
    }

    if (password !== confirmPassword) {
      toast.error(tErrors("passwordMismatch"))
      return
    }

    if (isCurrentUser) {
      changeCurrentUserPasswordMutation.mutate({
        currentPassword,
        newPassword: password,
      })
    } else {
      changeUserPasswordMutation.mutate({
        userId,
        password,
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{t("changePassword")}</SheetTitle>
            <SheetDescription>
              {t("changePasswordDescription")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4">
            {isCurrentUser && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{tSettings("currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={changeUserPasswordMutation.isPending || changeCurrentUserPasswordMutation.isPending}
                  placeholder={tSettings("currentPasswordPlaceholder")}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">{isCurrentUser ? tSettings("newPassword") : tUserManagement("newPassword")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={changeUserPasswordMutation.isPending || changeCurrentUserPasswordMutation.isPending}
                placeholder={isCurrentUser ? tSettings("newPasswordPlaceholder") : tUserManagement("passwordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={changeUserPasswordMutation.isPending || changeCurrentUserPasswordMutation.isPending}
                placeholder={isCurrentUser ? tSettings("confirmPasswordPlaceholder") : tUserManagement("confirmPasswordPlaceholder")}
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              type="submit"
              disabled={changeUserPasswordMutation.isPending || changeCurrentUserPasswordMutation.isPending}
            >
              {(changeUserPasswordMutation.isPending || changeCurrentUserPasswordMutation.isPending)
                ? (isCurrentUser ? tSettings("saving") : tUserManagement("loading"))
                : t("changePassword")}
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

