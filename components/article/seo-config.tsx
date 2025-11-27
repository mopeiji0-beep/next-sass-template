"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SeoConfigProps {
  metaTitleZh: string
  metaTitleEn: string
  metaDescriptionZh: string
  metaDescriptionEn: string
  metaKeywordsZh: string
  metaKeywordsEn: string
  ogImage: string
  onMetaTitleZhChange: (value: string) => void
  onMetaTitleEnChange: (value: string) => void
  onMetaDescriptionZhChange: (value: string) => void
  onMetaDescriptionEnChange: (value: string) => void
  onMetaKeywordsZhChange: (value: string) => void
  onMetaKeywordsEnChange: (value: string) => void
  onOgImageChange: (value: string) => void
}

export function SeoConfig({
  metaTitleZh,
  metaTitleEn,
  metaDescriptionZh,
  metaDescriptionEn,
  metaKeywordsZh,
  metaKeywordsEn,
  ogImage,
  onMetaTitleZhChange,
  onMetaTitleEnChange,
  onMetaDescriptionZhChange,
  onMetaDescriptionEnChange,
  onMetaKeywordsZhChange,
  onMetaKeywordsEnChange,
  onOgImageChange,
}: SeoConfigProps) {
  const t = useTranslations("dashboard.articleManagement")

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t("seo.title")}</h3>
        <Tabs defaultValue="zh" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zh">{t("chinese")}</TabsTrigger>
            <TabsTrigger value="en">{t("english")}</TabsTrigger>
          </TabsList>
          <TabsContent value="zh" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitleZh">{t("seo.metaTitle")}</Label>
              <Input
                id="metaTitleZh"
                value={metaTitleZh}
                onChange={(e) => onMetaTitleZhChange(e.target.value)}
                placeholder={t("seo.metaTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescriptionZh">{t("seo.metaDescription")}</Label>
              <Textarea
                id="metaDescriptionZh"
                value={metaDescriptionZh}
                onChange={(e) => onMetaDescriptionZhChange(e.target.value)}
                placeholder={t("seo.metaDescriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaKeywordsZh">{t("seo.metaKeywords")}</Label>
              <Input
                id="metaKeywordsZh"
                value={metaKeywordsZh}
                onChange={(e) => onMetaKeywordsZhChange(e.target.value)}
                placeholder={t("seo.metaKeywordsPlaceholder")}
              />
            </div>
          </TabsContent>
          <TabsContent value="en" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitleEn">{t("seo.metaTitle")}</Label>
              <Input
                id="metaTitleEn"
                value={metaTitleEn}
                onChange={(e) => onMetaTitleEnChange(e.target.value)}
                placeholder={t("seo.metaTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescriptionEn">{t("seo.metaDescription")}</Label>
              <Textarea
                id="metaDescriptionEn"
                value={metaDescriptionEn}
                onChange={(e) => onMetaDescriptionEnChange(e.target.value)}
                placeholder={t("seo.metaDescriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaKeywordsEn">{t("seo.metaKeywords")}</Label>
              <Input
                id="metaKeywordsEn"
                value={metaKeywordsEn}
                onChange={(e) => onMetaKeywordsEnChange(e.target.value)}
                placeholder={t("seo.metaKeywordsPlaceholder")}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ogImage">{t("seo.ogImage")}</Label>
        <Input
          id="ogImage"
          value={ogImage}
          onChange={(e) => onOgImageChange(e.target.value)}
          placeholder={t("seo.ogImagePlaceholder")}
        />
      </div>
    </div>
  )
}

