import { ClientsHero } from "@/components/clients/ClientsHero";
import { ClientShowcaseSection } from "@/components/site/clients/ClientShowcaseSection";
import {
  HomeMarketingLayout,
  HomeSection,
  HomeSectionInner,
} from "@/components/home/layout";
import { KpiIntegrityMonitor } from "@/components/analytics/KpiIntegrityMonitor";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { getBusinessStats } from "@/features/crm/businessStats";
import { CLIENTS_PAGE_COPY } from "@/features/site/data/routeCopy";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import {
  buildBreadcrumbJsonLd,
  buildPageJsonLd,
} from "@/features/site/data/seo";
import { formatKpiValuePlus } from "@/lib/kpiFormat";
import { SITE_URL } from "@/lib/siteUrl";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadClientsCopy() {
  return withLocaleCopy(
    { ...CLIENTS_PAGE_COPY, deliveryQuotesLabel: "Client delivery quotes" },
    "clients",
  );
}

/**
 * Clients page — Sector-wise tabbed client showcase with logos.
 * Implements plans/client-showcase-tabs with full roving-focus keyboard accessibility.
 * Links to /portfolio for workplace installation photos.
 */
export async function ClientsPageView() {
  const [{ stats, source }, copy, nonce] = await Promise.all([
    getBusinessStats(),
    loadClientsCopy(),
    getRequestNonce(),
  ]);
  const clientsValue = formatKpiValuePlus(stats.clientOrganisations);
  const clientsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/clients",
    title: `Client Directory & Sector Showcase | One&Only`,
    description: copy.heroSubtitle,
    pageType: "CollectionPage",
  });
  const clientsBreadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Clients", path: "/clients" },
  ]);

  return (
    <HomeMarketingLayout>
      <KpiIntegrityMonitor page="clients" source={source} stats={stats} />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(clientsJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(clientsBreadcrumbJsonLd),
        }}
      />
      <ClientsHero
        kicker="Client Directory"
        titleLead="Our"
        titleAccent="clients."
        subtitle={copy.heroSubtitleTemplate.replace("{clients}", clientsValue)}
      />

      <HomeSection variant="white" spacing="sm">
        <HomeSectionInner>
          <ClientShowcaseSection />
        </HomeSectionInner>
      </HomeSection>

      <section
        className="clients-trust-strip about-craft-strip scheme-accent-wash"
        aria-label={copy.deliveryQuotesLabel}
      >
        <div className="home-shell-xl clients-pull-quotes">
          {copy.pullQuotes.map((item) => (
            <figure
              key={item.attribution}
              className="clients-pull-quote about-craft-quote"
            >
              <span className="about-craft-quote__rule" aria-hidden="true" />
              <blockquote className="clients-pull-quote__text about-craft-quote__text text-pretty">
                {item.quote}
              </blockquote>
              <figcaption className="clients-pull-quote__attribution about-craft-quote__attribution">
                {item.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={copy.ctaKicker}
            title={
              <>
                See installed spaces or{" "}
                <span className="text-accent-italic-on-dark">
                  plan yours.
                </span>
              </>
            }
            description="Explore our workplace project gallery or connect with our workplace contract team."
            actions={[
              {
                href: "/portfolio",
                label: "View installation photos",
                variant: "primary",
              },
              {
                href: "/planning",
                label: "Workplace planning",
                variant: "outline-light",
              },
              {
                href: "/contact",
                label: "Contact us",
                variant: "outline-light",
              },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>

      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
