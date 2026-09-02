import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalBodyReveal } from "@/components/legal/LegalBodyReveal";
import { LegalRouteHero } from "@/components/legal/LegalRouteHero";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { SITE_CONTACT } from "@/features/site/data/contact";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");

  return buildPageMetadata(SITE_URL, {
    title: t("privacy.metadataTitle"),
    description: t("privacy.metadataDescription"),
    path: "/privacy",
    image: "/assets/marketing/hero/pages/Other3-oneandonly-bright.webp",
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const intro = t.raw("privacy.intro") as string[];
  const commitments = t.raw("privacy.commitments") as string[];
  const cookieRows = [
    {
      name: "oando_cookie_consent",
      category: t("privacy.cookies.categories.essential"),
      purpose: t("privacy.cookies.rows.consent"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_landing",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.landing"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_referrer",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.referrer"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_source",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.source"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_medium",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.medium"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_campaign",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.campaign"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_term",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.term"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_content",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.content"),
      duration: t("privacy.cookies.duration"),
    },
    {
      name: "oando_seo_locale",
      category: t("privacy.cookies.categories.analytics"),
      purpose: t("privacy.cookies.rows.locale"),
      duration: t("privacy.cookies.duration"),
    },
  ];

  return (
    <HomeMarketingLayout>
      <LegalRouteHero
        title={t("privacy.title")}
        subtitle={t("privacy.heroSubtitle")}
        testId="privacy-hero"
      />

      <div className="legal-bronze-rule" aria-hidden="true">
        <div className="legal-bronze-rule__inner home-shell-xl" />
      </div>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <LegalBodyReveal className="legal-layout grid gap-5 md:gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <aside
              data-legal-reveal
              className="scheme-panel-dark scheme-border legal-aside rounded-2xl border p-6 sm:p-7 md:p-9"
            >
              <p className="typ-label text-inverse-muted">
                {t("privacy.overviewKicker")}
              </p>
              <h2 className="home-heading legal-aside__title mt-3 text-inverse">
                {t("privacy.overviewTitle")}
              </h2>
              <p className="page-copy text-inverse-body mt-4">
                {t("privacy.overviewDescription")}
              </p>

              <div className="legal-aside-divider">
                <h3 className="typ-label text-inverse-muted">
                  {t("privacy.commitmentsTitle")}
                </h3>
                <ul className="text-inverse-body mt-4 space-y-3 text-sm leading-7">
                  {commitments.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <MarketingCtaLink
                  href="/contact"
                  label={t("privacy.ctas.contactTeam")}
                  surface="privacy-aside"
                  variant="primary"
                  context="hero"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("privacy.ctas.contactTeam")}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/downloads"
                  label={t("privacy.ctas.openResourceDesk")}
                  surface="privacy-aside"
                  variant="outline-light"
                  context="hero"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("privacy.ctas.openResourceDesk")}
                </MarketingCtaLink>
              </div>
            </aside>

            <div
              data-legal-reveal
              className="scheme-panel scheme-border rounded-2xl border p-6 sm:p-7 md:p-9"
            >
              <div className="space-y-5 sm:space-y-6">
                {intro.map((paragraph) => (
                  <p key={paragraph} className="page-copy text-body">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="scheme-border mt-8 grid gap-6 border-t pt-8 sm:mt-10 sm:gap-8 sm:pt-10 md:grid-cols-2">
                <article className="space-y-3 sm:space-y-4">
                  <h2 className="typ-card text-strong">
                    {t("privacy.information.title")}
                  </h2>
                  <p className="page-copy-sm text-body">
                    {t("privacy.information.firstParagraph")}
                  </p>
                  <p className="page-copy-sm text-body">
                    {t("privacy.information.secondParagraph")}
                  </p>
                </article>

                <article className="space-y-3 sm:space-y-4">
                  <h2 className="typ-card text-strong">{t("privacy.security.title")}</h2>
                  <p className="page-copy-sm text-body">
                    {t("privacy.security.firstParagraph")}
                  </p>
                  <p className="page-copy-sm text-body">
                    {t("privacy.security.secondParagraph")}
                  </p>
                </article>
              </div>

              <div className="scheme-panel-soft scheme-border mt-8 overflow-hidden rounded-2xl border sm:mt-10">
                <div className="px-5 py-5 sm:px-6 sm:py-6 md:px-8">
                  <h2 className="typ-card text-strong">{t("privacy.cookies.title")}</h2>
                  <p className="page-copy-sm text-body mt-3">
                    {t("privacy.cookies.description")}
                  </p>
                </div>

                {/* Mobile: card stack · Desktop: table */}
                <ul
                  className="legal-cookie-cards md:hidden"
                  aria-label={t("privacy.cookies.listAriaLabel")}
                >
                  {cookieRows.map((row) => (
                    <li key={row.name} className="legal-cookie-card">
                      <p className="legal-cookie-card__name">{row.name}</p>
                      <p className="legal-cookie-card__meta">
                        <span>{row.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{row.duration}</span>
                      </p>
                      <p className="legal-cookie-card__purpose">{row.purpose}</p>
                    </li>
                  ))}
                </ul>

                <div className="legal-cookie-table-scroll hidden md:block">
                  <table className="legal-cookie-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("privacy.cookies.headers.cookie")}</th>
                        <th scope="col">{t("privacy.cookies.headers.category")}</th>
                        <th scope="col">{t("privacy.cookies.headers.purpose")}</th>
                        <th scope="col">{t("privacy.cookies.headers.duration")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cookieRows.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.category}</td>
                          <td>{row.purpose}</td>
                          <td>{row.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="scheme-border mt-8 flex flex-col gap-4 border-t pt-8 sm:mt-10 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="typ-card text-strong">{t("privacy.questions.title")}</h2>
                  <p className="page-copy-sm text-body mt-2">
                    {t("privacy.questions.emailLead")} {" "}
                    <a
                      href={`mailto:${SITE_CONTACT.salesEmail}`}
                      className="font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                      {SITE_CONTACT.salesEmail}
                    </a>
                    {t("privacy.questions.emailTail")}
                  </p>
                </div>
                <MarketingCtaLink
                  href="/contact"
                  label={t("privacy.ctas.contactSupport")}
                  surface="privacy-body"
                  variant="outline"
                  className="w-full shrink-0 justify-center md:w-auto"
                >
                  {t("privacy.ctas.contactSupport")}
                </MarketingCtaLink>
              </div>
            </div>
          </LegalBodyReveal>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={t("privacy.cta.kicker")}
            title={
              <>
                {t("privacy.cta.titleLead")} {" "}
                <span className="text-accent-italic-on-dark">
                  {t("privacy.cta.titleAccent")}
                </span>
              </>
            }
            description={t("privacy.cta.description")}
            actions={[
              {
                href: "/contact",
                label: t("privacy.ctas.contactTeam"),
                variant: "primary",
              },
              {
                href: "/terms",
                label: t("privacy.ctas.viewTerms"),
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
