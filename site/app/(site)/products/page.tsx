import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { loadProductsCategoryTiles } from "@/components/home/CategoryGrid";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import {
  ProductsHero,
  ProductsPageView,
  type ProductPillar,
  type ProductsPageViewProps,
} from "@/components/products/ProductsPageView";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { PRODUCTS_HERO_IMAGE } from "@/features/site/data/productsPage";
import { buildPageJsonLd, buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { getRequestNonce } from "@/lib/security/requestNonce";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

/**
 * Products hub — editorial category grid, bronze punctuation, GSAP reveals.
 * Category listing: `/products/[category]` · PDP: `/products/[category]/[product]`.
 *
 * Hero is flushed before `getCatalog()` so lab LCP is not the catalog TTFB.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  const title = `${t("headlineLead")} ${t("headlineAccent")}`;
  return buildPageMetadata(SITE_URL, {
    title,
    description: t("heroSubtitle"),
    path: "/products",
    image: PRODUCTS_HERO_IMAGE.src,
  });
}

type ProductsCopy = Omit<ProductsPageViewProps, "categories" | "showHero">;

async function loadProductsCopy(): Promise<ProductsCopy> {
  const t = await getTranslations("products");
  return {
    heroKicker: t("heroKicker"),
    heroTitleLead: t("headlineLead"),
    heroTitleAccent: t("headlineAccent"),
    heroSubtitle: t("heroSubtitle"),
    heroPrimaryCta: t("heroPrimaryCta"),
    heroSecondaryCta: t("heroSecondaryCta"),
    craftQuote: t("craftQuote"),
    craftAttribution: t("craftAttribution"),
    introKicker: t("introKicker"),
    introTitleLead: t("introTitleLead"),
    introTitleAccent: t("introTitleAccent"),
    introDescription: t("introDescription"),
    featureBullets: t.raw("featureBullets") as string[],
    categoryRoutesKicker: t("categoryRoutesKicker"),
    categoryRoutesDescription: t("categoryRoutesDescription"),
    categoryRoutesCta: t("categoryRoutesCta"),
    rangeKicker: t("rangeKicker"),
    rangeTitleLead: t("rangeTitleLead"),
    rangeTitleAccent: t("rangeTitleAccent"),
    pillarsKicker: t("pillarsKicker"),
    pillarsTitleLead: t("pillarsTitleLead"),
    pillarsTitleAccent: t("pillarsTitleAccent"),
    pillarsIntro: t("pillarsIntro"),
    pillars: t.raw("pillars") as ProductPillar[],
    deskKicker: t("deskKicker"),
    deskTitle: t("deskTitle"),
    deskDescription: t("deskDescription"),
    deskPrimaryCta: t("deskPrimaryCta"),
    deskSecondaryCta: t("deskSecondaryCta"),
    deskTertiaryCta: t("deskTertiaryCta"),
  };
}

function ProductsCatalogPending() {
  return (
    <HomeSection variant="white" spacing="md" className="border-t-0">
      <HomeSectionInner>
        <div className="products-category-grid" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="products-category-tile">
              <div className="products-category-tile__media" />
              <div className="products-category-tile__body">
                <div className="products-category-tile__title">&nbsp;</div>
              </div>
            </div>
          ))}
        </div>
      </HomeSectionInner>
    </HomeSection>
  );
}

async function ProductsCatalogSections({ copy }: { copy: ProductsCopy }) {
  const t = await getTranslations("products");
  const categories = await loadProductsCategoryTiles((categoryId, fallback) => {
    const key = `categories.${categoryId}`;
    return t.has(key) ? t(key) : fallback;
  });

  return <ProductsPageView {...copy} categories={categories} showHero={false} />;
}

export default async function ProductsPage() {
  const [copy, nonce] = await Promise.all([
    loadProductsCopy(),
    getRequestNonce(),
  ]);
  const title = [copy.heroTitleLead, copy.heroTitleAccent].filter(Boolean).join(" ");

  const productsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/products",
    title,
    description: copy.heroSubtitle,
    pageType: "CollectionPage",
  });

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(productsJsonLd) }}
      />
      <link
        rel="preload"
        as="image"
        href={PRODUCTS_HERO_IMAGE.src}
        fetchPriority="high"
      />

      <ProductsHero
        heroKicker={copy.heroKicker}
        heroTitleLead={copy.heroTitleLead}
        heroTitleAccent={copy.heroTitleAccent}
        heroSubtitle={copy.heroSubtitle}
        heroPrimaryCta={copy.heroPrimaryCta}
        heroSecondaryCta={copy.heroSecondaryCta}
      />
      <Suspense fallback={<ProductsCatalogPending />}>
        <ProductsCatalogSections copy={copy} />
      </Suspense>
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
