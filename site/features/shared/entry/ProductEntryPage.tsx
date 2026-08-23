import Link from "next/link";

interface ProductEntryPageProps {
  title: string;
  eyebrow: string;
  description: string;
  authenticated: boolean;
  guestMode: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  recentLabel: string;
  statusLabel: string;
  restrictions: string[];
  capabilities: string[];
}

export function ProductEntryPage({
  title,
  eyebrow,
  description,
  authenticated,
  guestMode,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  recentLabel,
  statusLabel,
  restrictions,
  capabilities,
}: ProductEntryPageProps) {
  return (
    <section className="product-entry">
      <div className="product-entry__inner">
        <div className="product-entry__grid">
          <div className="product-entry__hero">
            <p className="typ-label product-entry__eyebrow">{eyebrow}</p>
            <h1 className="typ-display product-entry__title">{title}</h1>
            <p className="page-copy product-entry__lead">{description}</p>

            <div className="product-entry__actions">
              <Link href={primaryHref} className="btn-primary product-entry__cta">
                {primaryLabel}
              </Link>
              <Link href={secondaryHref} className="btn-outline product-entry__cta">
                {secondaryLabel}
              </Link>
            </div>

            <div className="product-entry__meta">
              <div className="product-entry__meta-card">
                <p className="typ-label text-subtle">Recent / resume</p>
                <p className="page-copy-sm">{recentLabel}</p>
              </div>
              <div className="product-entry__meta-card">
                <p className="typ-label text-subtle">Status</p>
                <p className="page-copy-sm">{statusLabel}</p>
              </div>
            </div>
          </div>

          <div className="product-entry__aside">
            <div className="product-entry__card">
              <p className="typ-label product-entry__aside-kicker">Capability summary</p>
              <ul className="product-entry__list">
                {capabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div
              className={
                guestMode
                  ? "product-entry__card product-entry__card--guest"
                  : "product-entry__card"
              }
            >
              <p className="typ-label product-entry__aside-kicker">Guest limitations</p>
              <p className="page-copy-sm product-entry__aside-copy">
                {guestMode
                  ? "Restricted actions remain visible inside the live tool and explain why they are unavailable."
                  : authenticated
                    ? "Member access unlocks the full output and persistence flow after you launch the tool."
                    : "Guests can still explore the live product surface, but output and persistence actions stay disabled."}
              </p>
              <ul className="product-entry__list">
                {restrictions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
