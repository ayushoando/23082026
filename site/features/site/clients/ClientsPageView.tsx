import { ClientsCaseStudies } from "@/components/clients/ClientsCaseStudies";
import { ClientsHero } from "@/components/clients/ClientsHero";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { KpiIntegrityMonitor } from "@/components/analytics/KpiIntegrityMonitor";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { getBusinessStats } from "@/features/crm/businessStats";
import { buildClientWorkWithPhotos } from "@/features/site/data/clientWorkPhotos";
import { CLIENTS_PAGE_COPY, CLIENTS_WORK } from "@/features/site/data/routeCopy";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { formatKpiValuePlus } from "@/lib/kpiFormat";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadClientsCopy() {
  return withLocaleCopy(
    { ...CLIENTS_PAGE_COPY, deliveryQuotesLabel: "Client delivery quotes" },
    "clients",
  );
}

/**
 * Hero → editorial proof strip → case studies → bronze pull quotes → CTA → ContactTeaser.
 * Photography-forward proof — no client logo wall, no centered KPI grid.
 */
export async function ClientsPageView() {
  const [{ stats, source }, clientWork, copy] = await Promise.all([
    getBusinessStats(),
    buildClientWorkWithPhotos(CLIENTS_WORK),
    loadClientsCopy(),
  ]);
  const clientsValue = formatKpiValuePlus(stats.clientOrganisations);
  const clientsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/clients",
    title: `${copy.heroTitle} | One&Only`,
    description: copy.heroSubtitle,
    pageType: "CollectionPage",
  });
  const clientsBreadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: copy.heroTitle, path: "/clients" },
  ]);

  return (
    <HomeMarketingLayout>
      <KpiIntegrityMonitor page="clients" source={source} stats={stats} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(clientsJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(clientsBreadcrumbJsonLd),
        }}
      />
      <ClientsHero
        kicker={copy.eyebrow}
        titleLead={copy.heroTitleLead}
        titleAccent={copy.heroTitleAccent}
        subtitle={copy.heroSubtitleTemplate.replace("{clients}", clientsValue)}
      />

      <HomeSection variant="white" spacing="sm">
        <HomeSectionInner>
          {clientWork.length === 0 ? (
            <div
              className="scheme-panel scheme-border rounded-2xl border px-6 py-10 text-center"
              role="status"
            >
              <h2 className="home-heading">{copy.emptyTitle}</h2>
              <p className="page-copy text-body mx-auto mt-4 max-w-lg">
                {copy.emptyDescription}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <MarketingCtaLink
                  href="/trusted-by/"
                  label={copy.trustedCta}
                  surface="clients-empty"
                  variant="outline"
                  className="w-full justify-center sm:w-auto"
                >
                  {copy.trustedCta}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/contact"
                  label={copy.contactCta}
                  surface="clients-empty"
                  variant="primary"
                  className="w-full justify-center sm:w-auto"
                >
                  {copy.contactCta}
                </MarketingCtaLink>
              </div>
            </div>
          ) : (
            <ClientsCaseStudies clients={clientWork} />
          )}
        </HomeSectionInner>
      </HomeSection>

      <section
        className="clients-trust-strip about-craft-strip scheme-accent-wash"
        aria-label={copy.deliveryQuotesLabel}
      >
        <div className="home-shell-xl clients-pull-quotes">
          {copy.pullQuotes.map((item) => (
            <figure key={item.attribution} className="clients-pull-quote about-craft-quote">
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
                {copy.ctaTitleLead}{" "}
                <span className="text-accent-italic-on-dark">
                  {copy.ctaTitleAccent}
                </span>
              </>
            }
            description={copy.ctaDescription}
            actions={[
              {
                href: "/planning",
                label: copy.planningCta,
                variant: "primary",
              },
              {
                href: "/contact",
                label: copy.contactCta,
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
