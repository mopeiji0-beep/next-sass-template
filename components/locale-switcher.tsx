"use client"

import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routing } from "@/i18n/routing"

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    // Get pathname without locale
    const segments = pathname.split("/").filter(Boolean)
    const currentLocaleIndex = segments.findIndex((seg) => 
      routing.locales.includes(seg as typeof routing.locales[number])
    )
    
    // Remove locale segment if found
    let pathWithoutLocale = "/"
    if (currentLocaleIndex !== -1) {
      segments.splice(currentLocaleIndex, 1)
      pathWithoutLocale = segments.length > 0 ? `/${segments.join("/")}` : "/"
    } else {
      // No locale in path, use current pathname
      pathWithoutLocale = pathname
    }
    
    // Use next-intl router to navigate with locale
    router.replace(pathWithoutLocale, { locale: newLocale })
  }

  const languages = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
  ]

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="text-sm font-medium">{currentLanguage.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
            className={locale === lang.code ? "bg-accent" : ""}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

