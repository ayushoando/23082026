import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ClientsPageView } from "@/features/site/clients/ClientsPageView";
import { CLIENT_DIRECTORY_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export async function generateMetadata(): Promise<Metadata> {
  void getTranslations("clients");
  return CLIENT_DIRECTORY_PAGE_METADATA;
}

export default async function ClientsPage() {
  return ClientsPageView();
}
