"use client";
import * as React from "react"
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
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
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tErrors = useTranslations("auth.errors");
  const tSuccess = useTranslations("auth.success");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = trpc.register.useMutation();
  const { data: authConfig, isLoading: configLoading } = trpc.getAuthConfig.useQuery();

  // Redirect if registration is disabled
  React.useEffect(() => {
    if (authConfig && !authConfig.allowRegistration) {
      router.push("/login");
    }
  }, [authConfig, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if registration is enabled
    if (authConfig && !authConfig.allowRegistration) {
      toast.error(tErrors("registrationDisabled"));
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
      await registerMutation.mutateAsync({
        name,
        email,
        password,
      });

      toast.success(tSuccess("registerSuccess"));

      // Auto login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

    //   console.log("Auto login result:", result); // Debug log

      if (result?.error) {
        // console.error("Auto login failed with error:", result.error);
        toast.error(tErrors("autoLoginFailed"));
        router.push("/login");
      } else if (result?.ok === true || result?.url) {
        router.push("/dashboard");
      } else {
        // Unexpected state
        // console.warn("Unexpected auto login result:", result);
        toast.error(tErrors("autoLoginFailed"));
        router.push("/login");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { message?: string }; message?: string })?.data?.message ||
        (error as { message?: string })?.message ||
        "An error occurred";
      if (errorMessage.includes("already exists") || errorMessage === "User already exists") {
        toast.error(tErrors("userExists"));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking config
  if (configLoading) {
    return null;
  }

  // If registration is disabled, return null to prevent loading translations
  // The useEffect above will handle the redirect
  if (authConfig && !authConfig.allowRegistration) {
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
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
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
          <div className="text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="underline hover:text-foreground">
              {t("signIn")}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

