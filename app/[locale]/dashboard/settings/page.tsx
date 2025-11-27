"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { IconKey, IconLoader2 } from "@tabler/icons-react"
import { ChangePasswordDialog } from "@/components/user/change-password-dialog"

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings")
  const tErrors = useTranslations("auth.errors")
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false)

  const { data: userData, isLoading } = trpc.getCurrentUser.useQuery()

  const updateUserMutation = trpc.updateCurrentUser.useMutation({
    onSuccess: () => {
      toast.success(t("updateSuccess"))
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

  React.useEffect(() => {
    if (userData) {
      setName(userData.name || "")
      setEmail(userData.email || "")
    }
  }, [userData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) {
      toast.error(tErrors("required"))
      return
    }

    updateUserMutation.mutate({
      name,
      // email 不可修改，不传递
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("accountInfo")}</CardTitle>
            <CardDescription>{t("accountInfoDescription")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={updateUserMutation.isPending}
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
                  disabled={true}
                  readOnly={true}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("save")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("password")}</CardTitle>
            <CardDescription>{t("passwordDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(true)}
              className="w-full sm:w-auto"
            >
              <IconKey className="mr-2 h-4 w-4" />
              {t("changePassword")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {userData?.id && (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
          userId={userData.id}
          isCurrentUser={true}
          onSuccess={() => {
            // 密码修改成功后的回调
          }}
        />
      )}
    </div>
  )
}

