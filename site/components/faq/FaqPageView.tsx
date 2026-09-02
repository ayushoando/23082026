import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";

export type FaqItem = { q: string; a: string };

export interface FaqPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  items: readonly FaqItem[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function FaqPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  items,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: FaqPageViewProps) {
  return (
    <>
      <HomeSection variant="white" spacing="sm" className="border-t-0 pt-24 md:pt-28">
        <HomeSectionInner>
          <p className="home-kicker">{heroKicker}</p>
          <h1 className="home-heading mt-3">
            {`${heroTitleLead} ${heroTitleAccent}`}
          </h1>
          <p className="page-copy-sm text-muted mt-4 max-w-2xl">{heroSubtitle}</p>

          <div className="faq-list">
            {items.map((item) => (
              <details key={item.q} className="faq-item">
                <summary>{item.q}</summary>
                <p className="page-copy text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="sm">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={ctaKicker}
            title={
              <>
                {ctaTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{ctaTitleAccent}</span>
              </>
            }
            description={ctaDescription}
            actions={[
              { href: "/contact", label: ctaPrimary, variant: "primary" },
              { href: "/planning", label: ctaSecondary, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
