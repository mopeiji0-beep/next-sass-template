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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface UserManagementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string | null
  onSuccess?: () => void
}

export function UserManagementDrawer({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: UserManagementDrawerProps) {
  const t = useTranslations("dashboard.userManagement")
  const tErrors = useTranslations("auth.errors")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const { data: userData, isLoading } = trpc.getUserById.useQuery(
    { id: userId! },
    { enabled: !!userId && open }
  )

  const createUserMutation = trpc.createUser.useMutation({
    onSuccess: () => {
      toast.success(t("createSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        ""
      if (errorMessage.includes("already exists") || errorMessage.includes("Email already")) {
        toast.error(t("errors.emailInUse"))
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const updateUserMutation = trpc.updateUser.useMutation({
    onSuccess: () => {
      toast.success(t("updateSuccess"))
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
    onError: (error) => {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        ""
      if (errorMessage.includes("Email already")) {
        toast.error(t("errors.emailInUse"))
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }

  React.useEffect(() => {
    if (userData && open) {
      setName(userData.name)
      setEmail(userData.email)
      setPassword("")
      setConfirmPassword("")
    } else if (!userId && open) {
      resetForm()
    }
  }, [userData, open, userId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password && password !== confirmPassword) {
      toast.error(tErrors("passwordMismatch"))
      return
    }

    if (password && password.length < 6) {
      toast.error(tErrors("passwordTooShort"))
      return
    }

    if (userId) {
      // Update user
      updateUserMutation.mutate({
        id: userId,
        name,
        email,
        ...(password ? { password } : {}),
      })
    } else {
      // Create user
      if (!password) {
        toast.error(tErrors("passwordTooShort"))
        return
      }
      createUserMutation.mutate({
        name,
        email,
        password,
      })
    }
  }

  const isLoadingData = Boolean(isLoading && userId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{userId ? t("editUser") : t("addUser")}</SheetTitle>
            <SheetDescription>
              {userId ? t("editUser") : t("addUser")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4 pr-1">
            {isLoadingData ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t("password")} {userId && ` (${t("leaveEmptyToKeep")})`}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!userId}
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  />
                </div>
                {password && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!!password}
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <SheetFooter>
            <Button
              type="submit"
              disabled={createUserMutation.isPending || updateUserMutation.isPending || isLoadingData}
            >
              {createUserMutation.isPending || updateUserMutation.isPending
                ? t("loading")
                : userId
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

