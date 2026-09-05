import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ClientsPageView } from "@/features/site/clients/ClientsPageView";
import { CLIENT_DIRECTORY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildClientsItemListJsonLd } from "@/features/site/data/seo";
import { getPublishedRecords } from "@/lib/clients/clientRegistry";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";
import { SITE_URL } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  void getTranslations("clients");
  return CLIENT_DIRECTORY_PAGE_METADATA;
}

export default async function ClientsPage() {
  const publishedClients = getPublishedRecords();
  const clientsItemListJsonLd = buildClientsItemListJsonLd(
    SITE_URL,
    publishedClients,
  );
  const [view, nonce] = await Promise.all([
    ClientsPageView(),
    getRequestNonce(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(clientsItemListJsonLd),
        }}
      />
      {view}
    </>
  );
}

