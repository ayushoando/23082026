import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PortfolioPageView } from "@/features/site/portfolio/PortfolioPageView";
import { CLIENTS_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export async function generateMetadata(): Promise<Metadata> {
  void getTranslations("clients");
  return CLIENTS_PAGE_METADATA;
}

export default async function PortfolioPage() {
}
