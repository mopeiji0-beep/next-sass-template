"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";

function ResetPasswordFormContent() {
  const t = useTranslations("auth.resetPassword");
  const tErrors = useTranslations("auth.errors");
  const tSuccess = useTranslations("auth.success");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const resetPasswordMutation = trpc.resetPassword.useMutation();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast.error(tErrors("invalidToken"));
      router.push("/forgot-password");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router, tErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(tErrors("invalidToken"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(tErrors("passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      toast.error(tErrors("passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password,
      });

      toast.success(tSuccess("passwordReset"));
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        "An error occurred";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : t("submit")}
          </Button>
          <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
            {t("backToLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}

