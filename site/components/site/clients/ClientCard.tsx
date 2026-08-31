import type { ClientRecord } from "@/lib/clients/clientTypes";
import { ClientLogoArea } from "./ClientLogoArea";

interface ClientCardProps {
  record: ClientRecord;
}

export function ClientCard({ record }: ClientCardProps) {
  return (
    <article
      aria-label={record.displayName}
      className="group relative overflow-hidden rounded-lg border border-soft bg-panel transition-shadow hover:shadow-theme-soft"
    >
      <ClientLogoArea
        displayName={record.displayName}
        logoPath={record.logoPath}
      />
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-body">
          {record.displayName}
        </p>
      </div>
    </article>
  );
}
