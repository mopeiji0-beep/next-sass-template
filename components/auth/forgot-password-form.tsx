"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as React from "react"
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

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tErrors = useTranslations("auth.errors");
  const tSuccess = useTranslations("auth.success");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const forgotPasswordMutation = trpc.forgotPassword.useMutation();
  const { data: authConfig, isLoading: configLoading } = trpc.getAuthConfig.useQuery();

  // Redirect if password reset is disabled
  React.useEffect(() => {
    if (authConfig && !authConfig.allowPasswordReset) {
      toast.error(tErrors("passwordResetDisabled"));
      router.push("/login");
    }
  }, [authConfig, router, tErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if password reset is enabled
    if (authConfig && !authConfig.allowPasswordReset) {
      toast.error(tErrors("passwordResetDisabled"));
      return;
    }
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await forgotPasswordMutation.mutateAsync({ email });

      if (result.success) {
        setEmailSent(true);
        toast.success(tSuccess("resetLinkSent"));
        
        // In development, show the reset token in console
        // if (result.resetToken) {
        //   console.log("Reset token (dev only):", result.resetToken);
        //   console.log("Reset URL:", `${window.location.origin}/reset-password?token=${result.resetToken}`);
        // }
      }
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

  if (emailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("checkEmail")}</CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to <strong>{email}</strong> if an account exists.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              {t("backToLogin")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
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
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

