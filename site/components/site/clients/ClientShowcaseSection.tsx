import { useTranslations } from "next-intl";
import { getGroupedRecords } from "@/lib/clients/clientRegistry";
import { ClientShowcase } from "./ClientShowcase";

export function ClientShowcaseSection() {
  const t = useTranslations("clients.showcase");
  const grouped = getGroupedRecords();

  return (
    <section
      className="w-full overflow-x-hidden section-y-sm"
      aria-label={t("sectionHeading")}
    >
      <div className="shell-container">
        <h2 className="home-heading mb-8 text-center">{t("sectionHeading")}</h2>
        <ClientShowcase grouped={grouped} />
      </div>
    </section>
  );
}
