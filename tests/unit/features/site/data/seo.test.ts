import { afterEach, describe, it, expect, vi } from 'vitest';
import type { Metadata } from 'next';
import {
  buildSiteMetadata,
  buildPageMetadata,
  buildPageJsonLd,
  buildBreadcrumbJsonLd,
  buildGlobalJsonLd,
  buildLocaleAlternates,
  buildProductJsonLd,
  buildCareerJobsJsonLd,
  buildCanonicalUrl,
  buildLocalBusinessJsonLd,
  buildShowroomsLocalBusinessJsonLd,
  buildFaqJsonLd,
  buildClientsItemListJsonLd,
  canonicalPath,
  sanitizeCanonicalPath,
  resolveDocumentTitle,
  countBrandPipeSegments,
  normalizeSiteOrigin,
  LOCALE_HREFLANG,
} from '@/features/site/data/seo';
import { SITE_BRAND } from '@/features/site/data/brand';
import { SITE_CONTACT, googleMapsOpenHref } from '@/features/site/data/contact';
import { getPublishedRecords } from '@/lib/clients/clientRegistry';
import { sanitizeJsonForScript } from '@/lib/security/sanitize';

type OpenGraphFields = {
  type?: string;
  locale?: string;
  url?: string | URL;
  images?: Array<string | { url?: string | URL; width?: number; height?: number }>;
};

type TwitterFields = {
  card?: string;
};

function openGraphFields(meta: Metadata): OpenGraphFields {
  return (meta.openGraph ?? {}) as OpenGraphFields;
}

function twitterFields(meta: Metadata): TwitterFields {
  return (meta.twitter ?? {}) as TwitterFields;
}

const TEST_SITE_URL = 'https://example.com';

// ---------------------------------------------------------------------------
// buildSiteMetadata
// ---------------------------------------------------------------------------

describe('buildSiteMetadata', () => {
  it('returns metadataBase as a URL object', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.metadataBase).toBeInstanceOf(URL);
    expect(meta.metadataBase!.toString()).toBe(TEST_SITE_URL + '/');
  });

  it('has a title object with default and template', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.title).toBeDefined();
    expect(typeof meta.title).toBe('object');
  });

  it('has a non-empty description', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.description!.length).toBeGreaterThan(10);
  });

  it('has keywords array', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(Array.isArray(meta.keywords)).toBe(true);
    expect(meta.keywords!.length).toBeGreaterThan(0);
  });

  it('has openGraph configuration', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    const og = openGraphFields(meta);
    expect(meta.openGraph).toBeDefined();
    expect(og.type).toBe('website');
    expect(og.locale).toBe('en_IN');
  });

  it('has openGraph images with url and alt, no fabricated dimensions', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    const images = openGraphFields(meta).images;
    expect(images).toBeDefined();
    expect(Array.isArray(images)).toBe(true);
    expect(images!.length).toBeGreaterThan(0);
    const first = images![0];
    const obj = typeof first === 'object' && first ? first : undefined;
    expect(obj?.url).toBeDefined();
    // The brand og image is not 1200×630 — never declare dimensions the asset
    // does not have (Open Graph makes width/height optional).
    expect(obj?.width).toBeUndefined();
    expect(obj?.height).toBeUndefined();
  });

  it('has twitter card configuration', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.twitter).toBeDefined();
    expect(twitterFields(meta).card).toBe('summary_large_image');
  });

  it('has robots allowing index and follow (incl. googleBot previews)', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    });
  });

  it('exposes web app manifest for install/share surfaces', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.manifest).toBe("/site.webmanifest");
  });

  // Break: homepage openGraph still listed hi/fr/de/es as alternateLocale while
  // localePrefix is never — same URL cannot be multiple locales (OPS-S12).
  it('omits openGraph.alternateLocale when localePrefix is never', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.openGraph?.alternateLocale).toBeUndefined();
    expect(meta.openGraph?.locale).toBe('en_IN');
  });
});

// ---------------------------------------------------------------------------
// buildLocaleAlternates
// ---------------------------------------------------------------------------

describe('buildLocaleAlternates', () => {
  it('does not list the same URL under multiple language tags when localePrefix is never', () => {
    const langs = buildLocaleAlternates(TEST_SITE_URL, '/planner');
    const canonical = 'https://example.com/planner/';
    expect(langs).toEqual({
      'en-IN': canonical,
      'x-default': canonical,
    });
    expect(langs['hi-IN']).toBeUndefined();
    expect(langs['de-DE']).toBeUndefined();
  });

  it('does not emit locale-prefixed paths for nested routes', () => {
    const langs = buildLocaleAlternates(TEST_SITE_URL, '/planner/features/measure');
    const canonical = 'https://example.com/planner/features/measure/';
    expect(langs['en-IN']).toBe(canonical);
    expect(langs['x-default']).toBe(canonical);
    expect(Object.values(langs).every((href) => !href.includes('/de/'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildPageMetadata
// ---------------------------------------------------------------------------

describe('resolveDocumentTitle', () => {
  it('appends brand once for plain titles', () => {
    expect(resolveDocumentTitle('Workstations')).toBe(
      `Workstations | ${SITE_BRAND.titleSuffix}`,
    );
    expect(countBrandPipeSegments(resolveDocumentTitle('Workstations'))).toBe(1);
  });

  it('collapses repeated brand suffixes (SF-02)', () => {
    const doubled = `Workstations | ${SITE_BRAND.titleSuffix} | ${SITE_BRAND.titleSuffix}`;
    const resolved = resolveDocumentTitle(doubled);
    expect(resolved).toBe(`Workstations | ${SITE_BRAND.titleSuffix}`);
    expect(countBrandPipeSegments(resolved)).toBe(1);
  });

  it('collapses three trailing brand segments and en-dash separators', () => {
    const messy = `Seating | ${SITE_BRAND.titleSuffix} – ${SITE_BRAND.titleSuffix} — ${SITE_BRAND.titleSuffix}`;
    expect(resolveDocumentTitle(messy)).toBe(`Seating | ${SITE_BRAND.titleSuffix}`);
  });

  it('keeps default title intact and strips an extra trailing brand', () => {
    expect(resolveDocumentTitle(SITE_BRAND.defaultTitle)).toBe(SITE_BRAND.defaultTitle);
    expect(
      resolveDocumentTitle(`${SITE_BRAND.defaultTitle} | ${SITE_BRAND.titleSuffix}`),
    ).toBe(SITE_BRAND.defaultTitle);
  });

  it('does not double-append when brand is already embedded mid-title', () => {
    const about = 'About One&Only | Office furniture Patna';
    expect(resolveDocumentTitle(about)).toBe(about);
    expect(countBrandPipeSegments(about)).toBe(0);
  });

  it('empty input falls back to default title', () => {
    expect(resolveDocumentTitle('   ')).toBe(SITE_BRAND.defaultTitle);
  });
});

describe('normalizeSiteOrigin / host honesty', () => {
  it('strips trailing slashes without inventing a host', () => {
    expect(normalizeSiteOrigin('https://seo-host.example.com///')).toBe(
      'https://seo-host.example.com',
    );
    expect(normalizeSiteOrigin('https://oando.co.in')).toBe('https://oando.co.in');
  });

  it('buildPageMetadata canonical uses the given origin, never localhost', () => {
    const meta = buildPageMetadata('https://seo-host.example.com///', {
      title: 'Workstations',
      description: 'Category of modular workstations for offices.',
      path: '/products/workstations',
    });
    expect(String(meta.alternates!.canonical)).toBe(
      'https://seo-host.example.com/products/workstations/',
    );
    expect(String(meta.alternates!.canonical)).not.toMatch(/localhost|127\.0\.0\.1/i);
    expect(meta.metadataBase!.toString()).toBe('https://seo-host.example.com/');
  });
});

describe('sanitizeCanonicalPath / buildCanonicalUrl open-redirect guards', () => {
  it('keeps ordinary marketing paths on the configured origin', () => {
    expect(sanitizeCanonicalPath('/about')).toBe('/about/');
    expect(sanitizeCanonicalPath('products/seating')).toBe('/products/seating/');
    expect(buildCanonicalUrl(TEST_SITE_URL, '/about')).toBe('https://example.com/about/');
    expect(buildCanonicalUrl(TEST_SITE_URL, '/products/seating/mesh-chair')).toBe(
      'https://example.com/products/seating/mesh-chair/',
    );
  });

  it('rejects absolute external URLs and schemes so canonicals never leave the site host', () => {
    for (const attack of [
      'https://evil.com',
      'http://evil.com/phish',
      '//evil.com/phish',
      'javascript:alert(1)',
      'foo://bar',
      '/\\evil.com',
      '/%2f%2fevil.com',
      '/products/seating/https://evil.com',
    ]) {
      expect(sanitizeCanonicalPath(attack), attack).toBe('/');
      const canonical = buildCanonicalUrl(TEST_SITE_URL, attack);
      expect(canonical, attack).toBe('https://example.com/');
      expect(canonical, attack).not.toMatch(/evil\.com|javascript:/i);
    }
  });

  it('buildPageMetadata never emits foreign-host canonicals from poisoned path input', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Poison',
      description: 'A long enough description for SEO security tests.',
      path: 'https://evil.example/steal',
    });
    expect(String(meta.alternates!.canonical)).toBe('https://example.com/');
    expect(String(meta.openGraph!.url)).toBe('https://example.com/');
    expect(String(meta.alternates!.canonical)).not.toMatch(/evil/i);
  });

  it('buildProductJsonLd rewrites foreign absolute product URLs onto the site origin', () => {
    const ld = buildProductJsonLd(TEST_SITE_URL, {
      name: 'Desk Pro',
      description: 'Modular desk for open offices and collaborative spaces.',
      url: 'https://evil.example/products/workstations/desk-pro',
      image: '/assets/catalog/desk.webp',
    });
    expect(ld.url).toBe('https://example.com/products/workstations/desk-pro');
    expect(ld['@id']).toBe('https://example.com/products/workstations/desk-pro#product');
    expect(String(ld.url)).not.toMatch(/evil/i);
  });
});

describe('buildPageMetadata', () => {
  const input = {
    title: 'Test Page',
    description: 'A description for testing',
    path: '/about',
  };

  it('sets an absolute title with a single brand suffix', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.title).toEqual({
      absolute: `Test Page | ${SITE_BRAND.titleSuffix}`,
    });
    expect(meta.openGraph!.title).toBe(`Test Page | ${SITE_BRAND.titleSuffix}`);
    expect(countBrandPipeSegments(String((meta.title as { absolute: string }).absolute))).toBe(1);
  });

  it('collapses pre-suffixed input into one absolute brand title', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      ...input,
      title: `Test Page | ${SITE_BRAND.titleSuffix} | ${SITE_BRAND.titleSuffix}`,
    });
    expect(meta.title).toEqual({
      absolute: `Test Page | ${SITE_BRAND.titleSuffix}`,
    });
  });

  it('sets the description from input', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.description).toBe('A description for testing');
  });

  it('builds canonical URL from siteUrl and path', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.alternates!.canonical).toBe('https://example.com/about/');
  });

  it('canonical URL has no double slashes in path', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, path: '/products/seating' });
    const canonical = meta.alternates!.canonical as string;
    // After protocol, no double slashes
    const afterProtocol = canonical.replace('https://', '');
    expect(afterProtocol).not.toContain('//');
  });

  it('openGraph url matches canonical', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.openGraph!.url).toBe('https://example.com/about/');
  });

  it('openGraph images declare no fabricated width/height', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    const images = meta.openGraph!.images as Array<{ width?: number; height?: number; url?: string | URL }>;
    expect(images[0].url).toBeDefined();
    expect(images[0].width).toBeUndefined();
    expect(images[0].height).toBeUndefined();
  });

  it('defaults type to website when not specified', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(openGraphFields(meta).type).toBe('website');
  });

  it('uses custom type when specified', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, type: 'article' });
    expect(openGraphFields(meta).type).toBe('article');
  });

  it('includes custom keywords when provided', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, keywords: ['test', 'page'] });
    expect(meta.keywords).toEqual(['test', 'page']);
  });
});

// ---------------------------------------------------------------------------
// buildPageJsonLd
// ---------------------------------------------------------------------------

describe('buildPageJsonLd', () => {
  const input = {
    path: '/about',
    title: 'About Us',
    description: 'Learn about our company',
    pageType: 'WebPage' as const,
  };

  it('has @context set to schema.org', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@context']).toBe('https://schema.org');
  });

  it('has @type matching input pageType', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@type']).toBe('WebPage');
  });

  it('builds url from siteUrl and path', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.url).toBe('https://example.com/about/');
  });

  it('sets name from title', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.name).toBe('About Us');
  });

  it('sets description from input', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.description).toBe('Learn about our company');
  });

  it('has @id with #webpage suffix', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@id']).toBe('https://example.com/about/#webpage');
  });

  it('sets inLanguage to en-IN', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.inLanguage).toBe('en-IN');
  });

  it('supports CollectionPage type', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, { ...input, pageType: 'CollectionPage' });
    expect(ld['@type']).toBe('CollectionPage');
  });
});

describe('buildCareerJobsJsonLd', () => {
  it('emits JobPosting graph for office furniture openings (India-wide)', () => {
    const ld = buildCareerJobsJsonLd(TEST_SITE_URL, [
      {
        title: 'Project Sales Manager',
        department: 'Enterprise Sales',
        location: 'India (multi-city)',
        postedDate: '2026-08-12',
      },
      {
        title: 'Sales Executive',
        department: 'Sales',
        location: 'India',
        postedDate: '2026-08-14',
      },
    ]);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph']).toHaveLength(2);
    expect(ld['@graph'][0]['@type']).toBe('JobPosting');
    expect(ld['@graph'][0].industry).toBe('Office Furniture');
    // datePosted is mandatory for Google job rich results — real dates only.
    expect(ld['@graph'][0].datePosted).toBe('2026-08-12');
    expect(ld['@graph'][1].datePosted).toBe('2026-08-14');
    // TELECOMMUTE postings carry no physical jobLocation — applicant
    // location requirements replace it (Google remote-posting guidance).
    expect('jobLocation' in ld['@graph'][0]).toBe(false);
    expect(ld['@graph'][0].jobLocationType).toBe('TELECOMMUTE');
    expect(ld['@graph'][0].applicantLocationRequirements.name).toBe('India');
    expect(ld['@graph'][1].description).toMatch(/India/i);
    expect(ld['@graph'][1].description).not.toMatch(/Patna|Ranchi|Jharkhand|Bihar/i);
  });
});

// ---------------------------------------------------------------------------
// buildBreadcrumbJsonLd
// ---------------------------------------------------------------------------

describe('buildBreadcrumbJsonLd', () => {
  it('has @type BreadcrumbList', () => {
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, [{ name: 'Home', path: '/' }]);
    expect(ld['@type']).toBe('BreadcrumbList');
  });

  it('creates list items with position starting at 1', () => {
    const items = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
  });

  it('builds full URLs for each breadcrumb item', () => {
    const items = [{ name: 'Products', path: '/products' }];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].item).toBe('https://example.com/products/');
  });

  it('sets name for each breadcrumb item', () => {
    const items = [{ name: 'Seating', path: '/products/seating' }];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].name).toBe('Seating');
  });
});

// ---------------------------------------------------------------------------
// buildGlobalJsonLd
// ---------------------------------------------------------------------------

describe('buildGlobalJsonLd', () => {
  it('returns schema.org graph with organization, website, and local business', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph']).toHaveLength(3);
    const types = ld['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'FurnitureStore']);
  });

  it('organization node includes contact points and social sameAs links', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const org = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'Organization');
    expect(org).toBeDefined();
    if (!org) {
      throw new Error('expected Organization node');
    }
    expect(org.name).toBe(SITE_BRAND.companyName);
    expect(org.logo).toBe(`${TEST_SITE_URL}/logo-v2.webp`);
    expect(org.email).toBe(SITE_CONTACT.salesEmail);
    expect(org.contactPoint).toHaveLength(2);
    expect(org.sameAs).toContain(TEST_SITE_URL);
    expect(org.sameAs?.length).toBeGreaterThan(SITE_CONTACT.socialLinks.length);
  });

  it('website node references organization publisher', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const website = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebSite');
    expect(website).toBeDefined();
    if (!website) {
      throw new Error('expected WebSite node');
    }
    expect(website.inLanguage).toBe('en-IN');
    expect(website.publisher?.['@id']).toBe(`${TEST_SITE_URL}#organization`);
  });

  it('local business node includes address, geo, hours, and social sameAs', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const store = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'FurnitureStore');
    expect(store).toBeDefined();
    if (!store) {
      throw new Error('expected FurnitureStore node');
    }
    expect(store.address?.addressLocality).toBe(SITE_CONTACT.address.addressLocality);
    expect(store.geo?.latitude).toBe(SITE_CONTACT.geo.latitude);
    expect(store.openingHours).toBe(SITE_CONTACT.openingHours);
    expect(store.priceRange).toBe(SITE_CONTACT.priceRange);
    expect(store.image).toContain(SITE_BRAND.ogImage);
    expect(store.sameAs?.length).toBeGreaterThan(0);
  });

  it('website node lists primary commercial ReadAction targets', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const website = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebSite');
    expect(website?.potentialAction?.['@type']).toBe('ReadAction');
    expect(website?.potentialAction?.target).toContain(`${TEST_SITE_URL}/products/`);
  });

  it('uses custom image when provided in buildPageMetadata', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Custom',
      description: 'Custom page',
      path: '/custom',
      image: '/custom-og.webp',
    });
    const images = meta.openGraph!.images as Array<{ url: string }>;
    expect(images[0].url).toBe('/custom-og.webp');
  });

  it('omits og:locale:alternate when localePrefix is never', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'About',
      description: 'About page description text here.',
      path: '/about',
    });
    expect(meta.openGraph?.alternateLocale).toBeUndefined();
    expect(meta.openGraph?.locale).toBe('en_IN');
  });

  it('sets robots indexable by default and noindex when indexable false', () => {
    const on = buildPageMetadata(TEST_SITE_URL, {
      title: 'On',
      description: 'Indexable page description text.',
      path: '/on',
    });
    expect(on.robots).toEqual({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    });
    const off = buildPageMetadata(TEST_SITE_URL, {
      title: 'Off',
      description: 'Utility page description text here.',
      path: '/off',
      indexable: false,
    });
    expect(off.robots).toEqual({
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    });
  });
});

describe('buildProductJsonLd', () => {
  it('mirrors visible fields and omits invented offers', () => {
    const ld = buildProductJsonLd(TEST_SITE_URL, {
      name: 'Chair A',
      description: 'Ergonomic task chair.',
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: ['/img/a.webp', '/img/b.webp'],
      sku: 'chair-a',
      category: 'Seating',
    });
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('Chair A');
    expect(ld.description).toBe('Ergonomic task chair.');
    expect(ld.sku).toBe('chair-a');
    expect(ld.category).toBe('Seating');
    expect(ld.image).toEqual([
      `${TEST_SITE_URL}/img/a.webp`,
      `${TEST_SITE_URL}/img/b.webp`,
    ]);
    expect(ld).not.toHaveProperty('offers');
  });
});

describe('resolveDocumentTitle brand-only collapse', () => {
  it('falls back when the remaining title is empty or a pure brand alias', () => {
    expect(resolveDocumentTitle('Oando')).toBe(SITE_BRAND.defaultTitle);
    expect(resolveDocumentTitle('One&Only')).toBe(SITE_BRAND.defaultTitle);
    expect(resolveDocumentTitle(` | ${SITE_BRAND.titleSuffix}`)).toBe(SITE_BRAND.defaultTitle);
    expect(resolveDocumentTitle('One and Only | One&Only')).toBe(SITE_BRAND.defaultTitle);
  });

  it('falls back when every pipe segment is a brand alias', () => {
    expect(resolveDocumentTitle('One&Only | One and Only | Oando | OneandOnly')).toBe(
      SITE_BRAND.defaultTitle,
    );
  });

  it('counts zero brand segments on blank titles', () => {
    expect(countBrandPipeSegments('')).toBe(0);
    expect(countBrandPipeSegments('   ')).toBe(0);
  });
});

describe('sanitizeCanonicalPath remaining guards', () => {
  it('collapses non-strings, query/hash-only input, and decode failures to /', () => {
    expect(sanitizeCanonicalPath(null as unknown as string)).toBe('/');
    expect(sanitizeCanonicalPath(undefined as unknown as string)).toBe('/');
    expect(sanitizeCanonicalPath(12 as unknown as string)).toBe('/');
    expect(sanitizeCanonicalPath('?utm=1')).toBe('/');
    expect(sanitizeCanonicalPath('#top')).toBe('/');
    expect(sanitizeCanonicalPath('/?ref=ad')).toBe('/');
    expect(sanitizeCanonicalPath('/foo%')).toBe('/');
    expect(sanitizeCanonicalPath('%20%20')).toBe('/');
  });

  it('rejects encoded NUL/backslash, control characters, and scheme-after-slash', () => {
    expect(sanitizeCanonicalPath('/%00foo')).toBe('/');
    expect(sanitizeCanonicalPath('/%5cevil')).toBe('/');
    expect(sanitizeCanonicalPath(`/${String.fromCharCode(0x01)}about`)).toBe('/');
    expect(sanitizeCanonicalPath(`/${String.fromCharCode(0x7f)}about`)).toBe('/');
    expect(sanitizeCanonicalPath('/javascript:alert(1)')).toBe('/');
  });

  it('canonicalPath prefixes a missing leading slash', () => {
    expect(canonicalPath('about')).toBe('/about/');
  });
});

describe('buildProductJsonLd URL and image branches', () => {
  const base = {
    name: 'Chair A',
    description: 'Ergonomic task chair.',
  };

  it('rewrites protocol-relative and relative product URLs onto the site origin', () => {
    const protocolRelative = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: '//example.com/products/seating/chair-a',
      image: '/img/a.webp',
    });
    expect(protocolRelative.url).toBe('https://example.com/products/seating/chair-a');

    const foreignProtocolRelative = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: '//evil.example/products/seating/chair-a',
      image: '/img/a.webp',
    });
    expect(foreignProtocolRelative.url).toBe('https://example.com/products/seating/chair-a');

    const relative = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: '/products/seating/chair-a',
      image: '/img/a.webp',
    });
    expect(relative.url).toBe('https://example.com/products/seating/chair-a');
  });

  it('falls back to the site root for empty or invalid product URLs', () => {
    const empty = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: '   ',
      image: '/img/a.webp',
    });
    expect(empty.url).toBe('https://example.com');

    const invalid = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: 'https://',
      image: '/img/a.webp',
    });
    expect(invalid.url).toBe('https://example.com');
  });

  it('omits image when every asset is blank and absolutizes relative files', () => {
    const omitted = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: ['', '   '],
    });
    expect(omitted).not.toHaveProperty('image');

    const emptyString = buildProductJsonLd(`${TEST_SITE_URL}/`, {
      ...base,
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: '',
      brandName: 'Custom Brand',
    });
    expect(emptyString).not.toHaveProperty('image');
    expect(emptyString.brand).toEqual({ '@type': 'Brand', name: 'Custom Brand' });

    const relativeAsset = buildProductJsonLd(`${TEST_SITE_URL}/`, {
      ...base,
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: 'img/a.webp',
    });
    expect(relativeAsset.image).toBe(`${TEST_SITE_URL}/img/a.webp`);

    const absoluteAsset = buildProductJsonLd(TEST_SITE_URL, {
      ...base,
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: 'https://cdn.example.com/chair.webp',
    });
    expect(absoluteAsset.image).toBe('https://cdn.example.com/chair.webp');
  });
});

describe('buildPageMetadata alternates and career description', () => {
  it('omits hreflang languages when alternates is false', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Utility',
      description: 'Utility page description text here.',
      path: '/offline',
      alternates: false,
    });
    expect(meta.alternates?.languages).toBeUndefined();
    expect(meta.alternates?.canonical).toBe('https://example.com/offline/');
  });

  it('uses a caller-supplied job description instead of the India-wide fallback', () => {
    const ld = buildCareerJobsJsonLd(TEST_SITE_URL, [
      {
        title: 'Project Sales Manager',
        department: 'Enterprise Sales',
        location: 'India (multi-city)',
        postedDate: '2026-08-12',
        description: 'Own enterprise furniture programmes across India.',
      },
    ]);
    expect(ld['@graph'][0].description).toBe(
      'Own enterprise furniture programmes across India.',
    );
  });
});

describe('buildFaqJsonLd', () => {
  it('emits FAQPage entities for the given path', () => {
    const ld = buildFaqJsonLd(TEST_SITE_URL, '/products/seating', [
      { question: 'Is this certified?', answer: 'BIFMA details are listed per model.' },
    ]);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld['@id']).toBe('https://example.com/products/seating/#faq');
    expect(ld.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Is this certified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BIFMA details are listed per model.',
        },
      },
    ]);
  });
});

describe('buildLocalBusinessJsonLd', () => {
  it('mirrors the FurnitureStore node with social sameAs hrefs', () => {
    const ld = buildLocalBusinessJsonLd(TEST_SITE_URL);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('FurnitureStore');
    expect(ld['@id']).toBe(`${TEST_SITE_URL}#localbusiness`);
    expect(ld.name).toBe(SITE_BRAND.companyName);
    expect(ld.legalName).toBe(SITE_BRAND.legalName);
    expect(ld.alternateName).toEqual([...SITE_BRAND.alternateNames]);
    expect(ld.url).toBe(TEST_SITE_URL);
    expect(ld.description).toBe(SITE_BRAND.localBusinessDescription);
    expect(ld.image).toBe(`${TEST_SITE_URL}${SITE_BRAND.ogImage}`);
    expect(ld.logo).toBe(`${TEST_SITE_URL}/logo-v2.webp`);
    expect(ld.address).toEqual({
      '@type': 'PostalAddress',
      ...SITE_CONTACT.address,
    });
    expect(ld.geo).toEqual({ '@type': 'GeoCoordinates', ...SITE_CONTACT.geo });
    expect(ld.telephone).toBe(SITE_CONTACT.salesPhone);
    expect(ld.email).toBe(SITE_CONTACT.salesEmail);
    expect(ld.openingHours).toBe(SITE_CONTACT.openingHours);
    expect(ld.priceRange).toBe(SITE_CONTACT.priceRange);
    expect(ld.areaServed).toEqual(SITE_CONTACT.areaServed);
    expect(ld.sameAs).toEqual(SITE_CONTACT.socialLinks.map((link) => link.href));
  });
});

describe('buildShowroomsLocalBusinessJsonLd', () => {
  it('differentiates the route node with verified facts only, sharing the global @id', () => {
    const ld = buildShowroomsLocalBusinessJsonLd(TEST_SITE_URL);
    const globalNode = buildGlobalJsonLd(TEST_SITE_URL)['@graph'].find(
      (node) => node['@type'] === 'FurnitureStore',
    );
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('FurnitureStore');
    // Same @id as the sitewide FurnitureStore so consumers merge, not duplicate.
    expect(ld['@id']).toBe(globalNode?.['@id']);
    expect(ld.name).toBe(SITE_BRAND.companyName);
    expect(ld.url).toBe(TEST_SITE_URL);
    expect(ld.telephone).toBe(SITE_CONTACT.salesPhone);
    expect(ld.address).toEqual({ '@type': 'PostalAddress', ...SITE_CONTACT.address });
    expect(ld.openingHours).toBe(SITE_CONTACT.openingHours);
    expect(ld.hasMap).toBe(googleMapsOpenHref());
    // No guessed or duplicated extras: geo/priceRange stay out of the route node.
    expect(ld).not.toHaveProperty('geo');
    expect(ld).not.toHaveProperty('priceRange');
  });
});

describe('buildSiteMetadata verification env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('emits google and bing verification tokens when env is set', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', ' google-site-code ');
    vi.stubEnv('NEXT_PUBLIC_BING_SITE_VERIFICATION', ' bing-site-code ');
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.verification).toMatchObject({
      google: 'google-site-code',
      other: { 'msvalidate.01': 'bing-site-code' },
    });
  });

  it('omits verification tokens when env is blank', () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION', '   ');
    vi.stubEnv('NEXT_PUBLIC_BING_SITE_VERIFICATION', '');
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.verification).toEqual({});
  });
});

describe('seo leftover path / product branches', () => {
  it('canonicalPath keeps homepage and already-slash paths stable', () => {
    expect(canonicalPath('')).toBe('/');
    expect(canonicalPath('/')).toBe('/');
    expect(canonicalPath('/about/')).toBe('/about/');
  });

  it('omits hreflang languages when the page is not indexable', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Utility',
      description: 'Utility page description text here.',
      path: '/offline',
      indexable: false,
    });
    expect(meta.alternates?.languages).toBeUndefined();
    expect(meta.robots).toEqual({
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    });
  });

  it('keeps a same-origin product URL and defaults brand when sku/category are omitted', () => {
    const ld = buildProductJsonLd(TEST_SITE_URL, {
      name: 'Chair A',
      description: 'Ergonomic task chair.',
      url: `${TEST_SITE_URL}/products/seating/chair-a`,
      image: '/img/a.webp',
    });
    expect(ld.url).toBe('https://example.com/products/seating/chair-a');
    expect(ld.image).toBe(`${TEST_SITE_URL}/img/a.webp`);
    expect(ld).not.toHaveProperty('sku');
    expect(ld).not.toHaveProperty('category');
    expect(ld.brand).toEqual({ '@type': 'Brand', name: SITE_BRAND.companyName });
  });

  it('treats a non-string product URL as the site root', () => {
    const ld = buildProductJsonLd(TEST_SITE_URL, {
      name: 'Chair A',
      description: 'Ergonomic task chair.',
      url: 12 as unknown as string,
      image: '/img/a.webp',
    });
    expect(ld.url).toBe('https://example.com');
  });
});

// ---------------------------------------------------------------------------
// buildClientsItemListJsonLd
// ---------------------------------------------------------------------------

describe('buildClientsItemListJsonLd', () => {
  it('returns valid Schema.org ItemList with correct metadata and counts', () => {
    const published = getPublishedRecords();
    const ld = buildClientsItemListJsonLd(TEST_SITE_URL, published);

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('ItemList');
    expect(ld['@id']).toBe('https://example.com/clients/#clients-directory');
    expect(ld.name).toBe('One&Only Enterprise & Institutional Client Directory');
    expect(ld.description).toContain('Verified workplace installations');
    expect(ld.numberOfItems).toBe(116);
    expect(ld.itemListElement).toHaveLength(116);
  });

  it('incorporates all 116 published records with 1-indexed sequential positions', () => {
    const published = getPublishedRecords();
    const ld = buildClientsItemListJsonLd(TEST_SITE_URL, published);

    expect(ld.itemListElement.length).toBe(116);
    ld.itemListElement.forEach((entry, index) => {
      expect(entry['@type']).toBe('ListItem');
      expect(entry.position).toBe(index + 1);

      const org = entry.item;
      expect(org['@type']).toBe('Organization');
      expect(org['@id']).toBe(`https://example.com/clients/#${published[index].canonicalId}-org`);
      expect(org.url).toBe(`https://example.com/clients/#${published[index].canonicalId}`);
      expect(org.name).toBe(published[index].displayName);

      // Every published client organisation must have verified absolute logo and image URLs
      expect(org.logo).toBeDefined();
      expect(org.image).toBeDefined();
      expect(org.logo).toBe(`https://example.com${published[index].logoPath}`);
      expect(org.image).toBe(`https://example.com${published[index].logoPath}`);
      expect(org.logo).toMatch(/^https:\/\/example\.com\/assets\/marketing\/client-logos\/.+/);
    });
  });

  it('handles client records without logoPath by omitting logo and image properties', () => {
    const synthetic = [
      { canonicalId: 'test-org', displayName: 'Test Organization' },
    ];
    const ld = buildClientsItemListJsonLd(TEST_SITE_URL, synthetic);

    expect(ld.numberOfItems).toBe(1);
    expect(ld.itemListElement).toHaveLength(1);
    const org = ld.itemListElement[0].item;
    expect(org.name).toBe('Test Organization');
    expect(org.url).toBe('https://example.com/clients/#test-org');
    expect(org).not.toHaveProperty('logo');
    expect(org).not.toHaveProperty('image');
  });

  it('handles empty client array gracefully', () => {
    const ld = buildClientsItemListJsonLd(TEST_SITE_URL, []);
    expect(ld.numberOfItems).toBe(0);
    expect(ld.itemListElement).toEqual([]);
  });

  it('serializes cleanly to script-safe JSON-LD', () => {
    const published = getPublishedRecords();
    const ld = buildClientsItemListJsonLd(TEST_SITE_URL, published);
    const serialized = sanitizeJsonForScript(ld);

    expect(typeof serialized).toBe('string');
    expect(serialized).not.toContain('<script');
    expect(serialized).not.toContain('</script>');

    const parsed = JSON.parse(serialized);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('ItemList');
    expect(parsed.numberOfItems).toBe(116);
    expect(parsed.itemListElement).toHaveLength(116);
  });
});

