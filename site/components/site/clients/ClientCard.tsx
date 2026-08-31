import type { ClientRecord } from "@/lib/clients/clientTypes";
import { ClientLogoArea } from "./ClientLogoArea";

interface ClientCardProps {
  record: ClientRecord;
}

export function ClientCard({ record }: ClientCardProps) {
  return (
    <article
      aria-label={record.displayName}
      className="group relative overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
    >
      <ClientLogoArea displayName={record.displayName} logoPath={record.logoPath} />
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-[var(--text-body)]">
          {record.displayName}
        </p>
      </div>
    </article>
  );
}
