import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ClientsPageView } from "@/features/site/clients/ClientsPageView";
import { CLIENTS_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export async function generateMetadata(): Promise<Metadata> {
  void getTranslations("clients");
  return CLIENTS_PAGE_METADATA;
}

export default function ClientsPage() {
  return ClientsPageView();
}
