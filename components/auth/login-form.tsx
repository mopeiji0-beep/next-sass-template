"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
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
import { trpc } from "@/lib/trpc/client";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: authConfig } = trpc.getAuthConfig.useQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // console.log("Login result:", result); // Debug: check what NextAuth returns

      // Check result status - NextAuth returns { error: string } on failure
      // When authorize returns null, NextAuth sets error to "CredentialsSignin"
      if (result?.error) {
        // Show error toast - ensure it displays
        const errorMsg = tErrors("invalidCredentials");
        // Use setTimeout to ensure toast is shown after state updates
        setTimeout(() => {
          toast.error(errorMsg, {
            duration: 5000,
          });
        }, 0);
        setIsLoading(false);
        return;
      }

      // Check if login was successful
      if (result?.ok === true || result?.url) {
        // Login successful
        router.push("/dashboard");
        return;
      }

      // Fallback: if no error but also not ok, treat as failure
      // This handles cases where result is null, undefined, or has unexpected structure
      setTimeout(() => {
        toast.error(tErrors("invalidCredentials"), {
          duration: 5000,
        });
      }, 0);
    } catch (error) {
      // Handle any exceptions during signIn
      setTimeout(() => {
        toast.error(tErrors("invalidCredentials"), {
          duration: 5000,
        });
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              {authConfig?.allowPasswordReset !== false && (
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : t("submit")}
          </Button>
          {authConfig?.allowRegistration && (
            <div className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/register" className="underline hover:text-foreground">
                {t("signUp")}
              </Link>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

