import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CATEGORY_ROUTE_COPY } from "@/features/site/data/routeCopy";
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { getCategoryFaqs } from "@/features/site/data/categoryFaqs";
import {
  buildRequestedCategoryCatalog,
  Catalog_SUBCATEGORY_LABELS,
  getCatalogCategoryDescription,
  getCatalogCategoryLabel,
  type RequestedCategoryId,
} from "@/lib/catalog/site/categories";
import type { CompatCategory } from "@/lib/catalog/site/getProducts";
import { getCatalog } from "@/lib/catalog/site/getProducts";
import { getCategoryLastUpdated } from "@/lib/catalog/productStaticParams";
import { CATEGORY_LISTING_HERO } from "@/features/site/data/productsPage";
import { HomeCatalogLayout } from "@/components/home/layout";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

import { FilterGrid } from "./FilterGrid";
import { CatalogLastUpdated } from "./CatalogLastUpdated";

const BASE_URL = SITE_URL;

const PRODUCT_GRID_CLASS =
  "catalog-product-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

function GridSkeleton() {
  return (
    <div className="home-shell-xl py-8 md:py-10">
      <div className={PRODUCT_GRID_CLASS}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-lg bg-muted sm:aspect-[4/5]"
          />
        ))}
      </div>
    </div>
  );
}

export async function CategoryPageView({ categoryId }: { categoryId: string }) {
  const requestedCatalog = buildRequestedCategoryCatalog(await getCatalog());
  const category = requestedCatalog.find((c: CompatCategory) => c.id === categoryId);

  if (requestedCatalog.length === 0) {
    return (
      <HomeCatalogLayout>
        <section className="catalog-lane home-shell-xl py-10 text-center md:py-14">
          <h1 className="home-heading text-balance">
            {CATEGORY_ROUTE_COPY.offlineTitle}
          </h1>
          <p className="page-copy text-body mx-auto mt-4 max-w-md">
            {CATEGORY_ROUTE_COPY.offlineDescription}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="btn-primary min-h-11">
              {CATEGORY_ROUTE_COPY.offlinePrimaryCta}
            </Link>
            <Link href="/" className="btn-outline min-h-11">
              {CATEGORY_ROUTE_COPY.offlineSecondaryCta}
            </Link>
          </div>
        </section>
      </HomeCatalogLayout>
    );
  }

  if (!category) {
    notFound();
  }

  const normalizedCategory: CompatCategory = {
    ...category,
    name: getCatalogCategoryLabel(categoryId, category.name),
    description: getCatalogCategoryDescription(categoryId, category.description),
  };

  const categoryPath = `/products/${categoryId}`;
  const categoryJsonLd = buildPageJsonLd(BASE_URL, {
    path: categoryPath,
    title: `${normalizedCategory.name} | ${CATEGORY_ROUTE_COPY.metadataSuffix}`,
    description: normalizedCategory.description,
    pageType: "CollectionPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(BASE_URL, [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: normalizedCategory.name, path: categoryPath },
  ]);
  const faqs = getCategoryFaqs(categoryId);
  const faqJsonLd = faqs.length > 0 ? buildFaqJsonLd(BASE_URL, categoryPath, faqs) : null;
  const lastUpdated = await getCategoryLastUpdated(categoryId);
  const lastUpdatedIso = lastUpdated?.toISOString();

  return (
    <HomeCatalogLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(faqJsonLd) }}
        />
      ) : null}

      <Suspense fallback={<GridSkeleton />}>
        {lastUpdatedIso ? (
          <div className="home-shell-xl pb-2 pt-6">
            <CatalogLastUpdated isoDate={lastUpdatedIso} />
          </div>
        ) : null}
        <FilterGrid
          category={normalizedCategory}
          categoryId={categoryId}
          heroImage={
            CATEGORY_LISTING_HERO[categoryId as RequestedCategoryId] ??
            CATEGORY_LISTING_HERO.workstations
          }
          subcategoryQuickLinks={
            Catalog_SUBCATEGORY_LABELS[categoryId as RequestedCategoryId] ?? []
          }
        />
      </Suspense>

      {faqs.length > 0 ? (
        <section className="catalog-faq-section home-shell-xl py-10 md:py-14 border-t border-soft">
          <div className="max-w-3xl">
            <h2 className="home-heading text-xl sm:text-2xl font-bold tracking-tight text-strong mb-2">
              Frequently Asked Questions: {normalizedCategory.name}
            </h2>
            <p className="page-copy text-body mb-6">
              Key technical specifications, warranties, and commercial ordering details.
            </p>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-xl border border-soft bg-surface p-4 transition-all open:border-primary/40 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-strong transition-colors hover:text-primary">
                    <span className="pr-4">{faq.question}</span>
                    <span className="ml-2 flex-shrink-0 text-muted transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-3 text-sm leading-relaxed text-body border-t border-soft/60 pt-3">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </HomeCatalogLayout>
  );
}
