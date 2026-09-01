import type { ClientRecord } from "@/lib/clients/clientTypes";
import { ClientLogoArea } from "./ClientLogoArea";

export interface ClientCardProps {
  record: ClientRecord;
}

/**
 * One published client: logo (or initials fallback) plus the display name.
 * The article is labelled by the client name so assistive tech announces the
 * client, not an unlabelled box.
 */
export function ClientCard({ record }: ClientCardProps) {
  return (
    <article aria-label={record.displayName} className="clients-showcase__card">
      <ClientLogoArea
        displayName={record.displayName}
        logoPath={record.logoPath}
      />
      <p className="clients-showcase__card-name">{record.displayName}</p>
    </article>
  );
}
