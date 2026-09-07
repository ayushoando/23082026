import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { HomeMarketingLayout } from "@/components/home/layout";
import { SitemapPageView } from "@/components/sitemap/SitemapPageView";
import { buildSitemapSections } from "@/features/site/data/htmlSitemap";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.sitemap");
  return buildPageMetadata(SITE_URL, {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    path: "/sitemap",
    keywords: ["sitemap", "One and Only pages", "office furniture site map"],
  });
}

export default async function HtmlSitemapPage() {
  const t = await getTranslations("marketing.sitemap");
  const sections = buildSitemapSections();

  return (
    <HomeMarketingLayout>
      <SitemapPageView
        kicker={t("kicker")}
        title={t("title")}
        subtitle={t("subtitle")}
        sections={sections}
      />
    </HomeMarketingLayout>
  );
}
