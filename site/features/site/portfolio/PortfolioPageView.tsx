import { ClientsCaseStudies } from "@/components/clients/ClientsCaseStudies";
import { ClientsHero } from "@/components/clients/ClientsHero";
import {
  HomeMarketingLayout,
  HomeSection,
  HomeSectionInner,
} from "@/components/home/layout";
import { KpiIntegrityMonitor } from "@/components/analytics/KpiIntegrityMonitor";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { OpenAssistantButton } from "@/features/shared/entry/OpenAssistantButton";
import { getBusinessStats } from "@/features/crm/businessStats";
import { buildClientWorkWithPhotos } from "@/features/site/data/clientWorkPhotos";
import {
  CLIENTS_PAGE_COPY,
  CLIENTS_WORK,
} from "@/features/site/data/routeCopy";
import { withLocaleCopy } from "@/lib/i18n/withLocaleCopy";
import {
  buildBreadcrumbJsonLd,
  buildPageJsonLd,
} from "@/features/site/data/seo";
import { formatKpiValuePlus } from "@/lib/kpiFormat";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

async function loadPortfolioCopy() {
  return withLocaleCopy(
    { ...CLIENTS_PAGE_COPY, deliveryQuotesLabel: "Portfolio installation quotes" },
    "portfolio",
  );
}

/**
 * Portfolio page — Photography-forward workplace installation proof.
 * Focuses on case studies, seat counts, and real installed workspace photos.
 * Links to /clients for the sector-wise tabbed client directory.
 */
export async function PortfolioPageView() {
  const [{ stats, source }, clientWork, copy, nonce] = await Promise.all([
    getBusinessStats(),
    buildClientWorkWithPhotos(CLIENTS_WORK),
    loadPortfolioCopy(),
    getRequestNonce(),
  ]);
  const clientsValue = formatKpiValuePlus(stats.clientOrganisations);
  const projectCount = clientWork.length;
  const photoCount = clientWork.reduce((total, project) => total + project.photos.length, 0);
  const portfolioJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/portfolio",
    title: `Workplace Projects & Portfolio | One&Only`,
    description: copy.heroSubtitle,
    pageType: "CollectionPage",
  });
  const portfolioBreadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Portfolio", path: "/portfolio" },
  ]);

  return (
    <HomeMarketingLayout>
      <KpiIntegrityMonitor page="portfolio" source={source} stats={stats} />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(portfolioJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(portfolioBreadcrumbJsonLd),
        }}
      />
      <ClientsHero
        kicker="Workplace Photography"
        titleLead="Workplace"
        titleAccent="projects."
        subtitle={copy.heroSubtitleTemplate.replace("{clients}", clientsValue)}
        variant="portfolio"
      />

      <HomeSection variant="white" spacing="sm" className="portfolio-index-section border-t-0">
        <HomeSectionInner>
          <div className="portfolio-index" aria-labelledby="portfolio-index-title">
            <div className="portfolio-index__intro">
              <p className="home-kicker">Selected installations</p>
              <h2 id="portfolio-index-title" className="home-heading text-pretty">
                Explore the work by project.
              </h2>
              <p className="portfolio-index__description page-copy text-body">
                {projectCount} documented workplaces and {photoCount} installation photographs,
                organised for quick review.
              </p>
              <OpenAssistantButton
                label="Plan with AI"
                mode="ai"
                className="btn btn-primary portfolio-index__ai"
              />
            </div>
            <nav className="portfolio-index__nav" aria-label="Portfolio project index">
              {clientWork.map((project, index) => (
                <a
                  key={project.id}
                  href={`#portfolio-project-${project.id}`}
                  className="portfolio-index__link"
                >
                  <span className="portfolio-index__number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{project.name}</strong>
                    <small>{project.location}</small>
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </HomeSectionInner>
      </HomeSection>

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
                  href="/clients"
                  label="View client directory"
                  surface="clients-empty"
                  variant="outline"
                  className="w-full justify-center sm:w-auto"
                >
                  View client directory
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
            kicker="Next step"
            title={
              <>
                See organisations or{" "}
                <span className="text-accent-italic-on-dark">
                  plan your space.
                </span>
              </>
            }
            description="Explore our sector-wise client directory or brief our workplace planning team."
            actions={[
              {
                href: "/clients",
                label: "Client directory",
                variant: "primary",
              },
              {
                href: "/planning",
                label: "Workplace planning",
                variant: "outline-light",
              },
              {
                href: "/contact",
                label: "Contact sales",
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
