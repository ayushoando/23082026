import { getTranslations } from "next-intl/server";
import { getGroupedRecords, SECTOR_TABS } from "@/lib/clients/clientRegistry";
import { ClientShowcase } from "./ClientShowcase";

/**
 * Page-level section wrapper for the sector showcase. RSC: reads the
 * compile-time registry synchronously and hands the grouped records to the
 * client boundary. `getGroupedRecords()` already restricts to published
 * records, so nothing unreviewed can reach the page.
 */
export async function ClientShowcaseSection() {
  const t = await getTranslations("clients.showcase");
  const grouped = getGroupedRecords();

  return (
    <section
      className="section-y-sm w-full overflow-x-hidden"
      aria-labelledby="clients-showcase-heading"
    >
      <div className="shell-container">
        <h2
          id="clients-showcase-heading"
          className="home-heading mb-6 max-w-3xl"
        >
          {t("sectionHeading")}
        </h2>
        <ClientShowcase grouped={grouped} tabs={SECTOR_TABS} />
      </div>
    </section>
  );
}
