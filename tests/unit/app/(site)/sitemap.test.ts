import { describe, it, expect, vi } from 'vitest';
import sitemap from '@/app/sitemap';
import * as productStaticParams from '@/lib/catalog/productStaticParams';
import {
  PLANNER_MARKETING_SITEMAP_PATHS,
  PUBLIC_INDEXABLE_STATIC_PATHS,
  SOLUTION_CATEGORY_SITEMAP_PATHS,
} from '@/features/site/data/routeClassification';
import { SITE_URL } from '@/lib/siteUrl';

vi.mock('@/lib/catalog/productStaticParams', () => ({
  buildProductStaticParams: vi.fn(),
  buildCatalogLastModifiedByPath: vi.fn(async () => new Map()),
}));

describe('sitemap.ts', () => {
  it('includes indexable static and planner marketing paths, not utility noindex routes', async () => {
    vi.spyOn(productStaticParams, 'buildProductStaticParams').mockRejectedValue(new Error('fail'));

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    for (const path of PUBLIC_INDEXABLE_STATIC_PATHS) {
      if (path === '/') {
        expect(urls.some((url) => /^https?:\/\/[^/]+\/$/.test(url))).toBe(true);
      } else {
        expect(urls.some((url) => url.includes(`${path}/`) || url.endsWith(path))).toBe(true);
      }
    }
    for (const path of PLANNER_MARKETING_SITEMAP_PATHS) {
      expect(urls.some((url) => url.includes(`${path}/`) || url.endsWith(path))).toBe(true);
    }
    for (const path of SOLUTION_CATEGORY_SITEMAP_PATHS) {
      expect(urls.some((url) => url.includes(`${path}/`) || url.endsWith(path))).toBe(false);
    }
    expect(urls.some((url) => url.includes('/clients/') || url.endsWith('/clients'))).toBe(true);
    expect(urls.some((url) => url.includes('/solutions/'))).toBe(false);

    expect(urls.some((url) => url.includes('/quote-cart/'))).toBe(false);
    expect(urls.some((url) => url.includes('/tracking/'))).toBe(false);
    expect(urls.some((url) => url.includes('/planner/lib/'))).toBe(false);
    // Security: never list private or machine surfaces
    expect(urls.some((url) => url.includes('/admin/'))).toBe(false);
    expect(urls.some((url) => url.includes('/api/'))).toBe(false);
    expect(urls.some((url) => url.includes('/portal/'))).toBe(false);
    expect(urls.some((url) => url.includes('/dashboard/'))).toBe(false);
    expect(urls.some((url) => url.includes('/access/'))).toBe(false);
    expect(urls.some((url) => url.includes("/ooplanner/"))).toBe(false);
    expect(urls.some((url) => url.includes('/planner/canvas/'))).toBe(false);
    expect(urls.some((url) => url.includes('/planner/guest/'))).toBe(false);
    expect(urls.some((url) => url.includes('/planner/features/3d-view'))).toBe(false);
  });

  it("does not emit empty category shells when the catalog is empty", async () => {
    vi.spyOn(productStaticParams, "buildProductStaticParams").mockResolvedValue([]);

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);
    expect(urls.some((url) => /\/products\/seating\/?$/.test(url))).toBe(false);
    expect(urls.some((url) => url.includes("/planner/features/3d-view"))).toBe(false);
  });

  it('returns sitemap when catalog fetch succeeds', async () => {
    vi.spyOn(productStaticParams, 'buildProductStaticParams').mockResolvedValue([
      { category: 'seating', product: 'slug1' },
      { category: 'seating', product: 'p2' },
    ]);

    const result = await sitemap();
    expect(result.some(r => r.url.includes('slug1'))).toBe(true);
    expect(result.some(r => r.url.includes('p2'))).toBe(true);
  });

  it('skips catalog rows with host-injection, UUIDs, or traversal slugs', async () => {
    vi.spyOn(productStaticParams, 'buildProductStaticParams').mockResolvedValue([
      { category: 'seating', product: 'mesh-chair' },
      { category: 'seating', product: 'https://evil.com' },
      { category: 'seating', product: '..' },
      { category: 'seating', product: 'a/b' },
      { category: 'seating', product: 'b949fce5-1d9b-dd47-b986-b1754e20c3f8' },
      { category: '../admin', product: 'y' },
    ]);

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);
    expect(urls.some((url) => url.includes('/products/seating/mesh-chair/'))).toBe(true);
    expect(urls.some((url) => /evil\.com/i.test(url))).toBe(false);
    expect(urls.some((url) => url.includes('/admin/'))).toBe(false);
    expect(urls.some((url) => url.includes('/products/../'))).toBe(false);
    expect(urls.some((url) => url.includes('b949fce5-1d9b-dd47-b986-b1754e20c3f8'))).toBe(false);
  });

  it('prefixes every URL with SITE_URL and never hardcodes localhost', async () => {
    vi.spyOn(productStaticParams, 'buildProductStaticParams').mockRejectedValue(new Error('fail'));
    const result = await sitemap();
    const base = SITE_URL.replace(/\/+$/, '');
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.url.startsWith(`${base}/`)).toBe(true);
      expect(entry.url).not.toMatch(/localhost|127\.0\.0\.1/i);
    }
  });
});