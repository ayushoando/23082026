import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ClientsPageView } from "@/features/site/clients/ClientsPageView";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  void getTranslations("clients");
  return buildPageMetadata(SITE_URL, {
    title: "Client Directory & Sector Showcase | One&Only",
    description:
      "A curated, sector-wise directory of verified client organisations furnished across India since 2011.",
    path: "/clients",
  });
}

export default async function ClientsPage() {
  return ClientsPageView();
}
