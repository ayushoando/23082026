import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ClientsPageView } from "@/features/site/clients/ClientsPageView";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const [clients, marketing] = await Promise.all([
    getTranslations("clients"),
    getTranslations("marketing.clients"),
  ]);
  return buildPageMetadata(SITE_URL, {
    title: `${clients("heroTitle")} | One&Only`,
    description: marketing("heroSubtitle"),
    path: "/clients",
  });
}

export default async function ClientsPage() {
  return ClientsPageView();
}
