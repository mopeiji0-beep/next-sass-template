import { RegisterForm } from "@/components/auth/register-form";
import { redirect } from "next/navigation";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Check if registration is enabled - redirect if disabled
  // This prevents loading the component and translations
  if (process.env.ALLOW_REGISTRATION === "false") {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}

