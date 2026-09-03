import {
  apexRedirectLocation,
  cacheControlForPath,
  shouldCacheResponse,
} from './cachePolicy.js';

/** Applied to every worker-served response; apex is HTTPS-only. */
const HSTS_HEADER = 'max-age=31536000; includeSubDomains; preload';

/** RFC 9116 security.txt - served at edge so scanners pass before Next deploy. */
const SECURITY_TXT = `# One&Only (oando.co.in) - security disclosure contact (RFC 9116)
# Prefer responsible disclosure for security issues only (not sales or support).

Contact: mailto:sales@oando.co.in
Contact: tel:+91-98356-30940
Expires: 2027-08-09T00:00:00.000Z
Preferred-Languages: en, hi
Canonical: https://oando.co.in/.well-known/security.txt
Policy: https://oando.co.in/privacy/
Hiring: https://oando.co.in/career/
`;

function securityTxtResponse() {
  return new Response(SECURITY_TXT, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
      'strict-transport-security': HSTS_HEADER,
      'x-oando-proxy': 'security-txt',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // `new URL("//host/path", origin)` changes hosts. `pathname` is
    // client-controlled, so reject protocol-relative paths before it is used
    // to construct the trusted Vercel origin URL below.
    if (pathname.startsWith('//')) {
      return new Response('Invalid request path', {
        status: 400,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'strict-transport-security': HSTS_HEADER,
          'x-oando-proxy': 'invalid-path',
        },
      });
    }

    const apexLocation = apexRedirectLocation(url);
    if (apexLocation) {
      return new Response(null, {
        status: 308,
        headers: {
          location: apexLocation,
          'cache-control': 'public, max-age=3600',
          'strict-transport-security': HSTS_HEADER,
          'x-oando-proxy': 'www-to-apex',
        },
      });
    }

    // RFC 9116 - canonical + root alias (before R2 / Vercel).
    // Normalize trailing slash so scanners that append / still pass.
    const securityPath = pathname.replace(/\/+$/, '') || '/';
    if (
      securityPath === '/.well-known/security.txt' ||
      securityPath === '/security.txt'
    ) {
      return securityTxtResponse();
    }

    // Try R2 first for asset paths (locked layout: /assets/{marketing|catalog}/…)
    // Bucket keys are often stored without the leading "assets/" (mirror-assets-to-r2.mjs);
    // also accept full pathname keys so either layout hits R2.
    // Cost guard: asset paths NEVER fall through to Vercel. An R2 miss serves the
    // brand fallback (same image the site's onError chains use) with a short TTL;
    // only a hard R2 error falls through to the origin for resilience.
    const isAssetPath = pathname.startsWith('/assets/') || pathname.startsWith('/images/');
    let assetObject = null;
    let r2Errored = false;
    if (isAssetPath) {
      try {
        const seatingLeather = new Set(['grace', 'pinnacle', 'moonlight', 'rider']);
        const seatingCafe = new Set([
          'cafe-sleek', 'caneva', 'caneva-high', 'casca', 'fusion', 'fynn', 'halo',
          'leaf', 'lexus', 'lisbo', 'nordic', 'rio', 'smile', 'snap', 'zilo',
        ]);
        const seatingFabric = new Set([
          'arvo', 'brim', 'canaret', 'copse', 'crotch', 'crox', 'dive', 'ember', 'flare', 'flip',
        ]);
        const seatingSub = (sku) => {
          const slug = String(sku).replace(/^oando-seating--/i, '').toLowerCase();
          if (seatingLeather.has(slug)) return 'leather';
          if (seatingCafe.has(slug)) return 'cafe';
          if (seatingFabric.has(slug)) return 'fabric';
          return 'mesh';
        };
        const rewriteSeating = (key) =>
          key.replace(
            /(^|\/)seating\/non-leather\/(oando-seating--[^/]+)/i,
            (_m, lead, sku) => `${lead}seating/${seatingSub(sku)}/${sku}`,
          );

        const r2Keys = [];
        const baseKey = rewriteSeating(pathname.slice(1));
        const variants = [baseKey];
        if (baseKey.includes('/gallery/')) {
          variants.push(baseKey.replace(/\/gallery\//g, '/'));
        }
        for (const variant of variants) {
          r2Keys.push(variant);
          if (variant.startsWith('assets/')) {
            r2Keys.push(variant.slice('assets/'.length));
          }
          const numbered = variant.match(/^(.*\/image-)0*(\d+)(\.[a-z0-9]+)$/i);
          if (numbered) {
            r2Keys.push(`${numbered[1]}${numbered[2]}${numbered[3]}`);
            r2Keys.push(`${numbered[1]}0${numbered[2]}${numbered[3]}`);
            if (variant.startsWith('assets/')) {
              const unpadded = `${numbered[1]}${numbered[2]}${numbered[3]}`;
              const padded = `${numbered[1]}0${numbered[2]}${numbered[3]}`;
              r2Keys.push(unpadded.slice('assets/'.length));
              r2Keys.push(padded.slice('assets/'.length));
            }
          }
        }

        let object = null;
        for (const key of r2Keys) {
          object = await env.ASSET_BUCKET.get(key);
          if (object) break;
        }

        if (!object && pathname.startsWith('/images/')) {
          const remappedTail = pathname
            .slice('/images/'.length)
            .replace(/^products\//, 'catalog/products/')
            .replace(/^(hero|client-logos|projects|fallback|home|brand)\//, 'marketing/$1/')
            .replace(/^catalog\//, 'catalog/');
          for (const remapped of [`assets/${remappedTail}`, remappedTail]) {
            object = await env.ASSET_BUCKET.get(remapped);
            if (object) break;
          }
        }

        assetObject = object;
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('cache-control', 'public, max-age=31536000, immutable');
          headers.set('strict-transport-security', HSTS_HEADER);
          headers.set('x-oando-proxy', 'r2');
          
          return new Response(object.body, {
            headers,
          });
        }
      } catch (e) {
        // R2 fetch failed; fall through to Vercel for resilience.
        r2Errored = true;
        console.error('R2 error:', e);
      }
    }

    // Asset miss -> brand fallback from R2 (PRODUCT_IMAGE_FALLBACK equivalent,
    // site/lib/assetPaths.ts). Short TTL so a later mirror upload is not masked
    // for long. Vercel is never billed for asset traffic.
    if (isAssetPath && !assetObject && !r2Errored) {
      try {
        const fallback = await env.ASSET_BUCKET.get('marketing/brand/logos/logo-sharp.png');
        if (fallback) {
          const headers = new Headers();
          fallback.writeHttpMetadata(headers);
          headers.set('etag', fallback.httpEtag);
          headers.set('cache-control', 'public, max-age=300');
          headers.set('strict-transport-security', HSTS_HEADER);
          headers.set('x-oando-proxy', 'r2-fallback');
          return new Response(fallback.body, { headers });
        }
      } catch (e) {
        console.error('R2 fallback error:', e);
      }
      return new Response('Not Found', {
        status: 404,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'strict-transport-security': HSTS_HEADER,
          'x-oando-proxy': 'r2-miss',
        },
      });
    }

    // Fall back to Vercel. VERCEL_ORIGIN has a single source of truth:
    // wrangler.toml [vars] (12.1). No code fallback — a missing var fails fast
    // with a clear 500 instead of silently proxying to a stale hardcoded host.
    const origin = env.VERCEL_ORIGIN;
    if (!origin) {
      return new Response('VERCEL_ORIGIN is not configured (set [vars] in wrangler.toml)', {
        status: 500,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'strict-transport-security': HSTS_HEADER,
          'x-oando-proxy': 'config-error',
        },
      });
    }
    const targetUrl = new URL(pathname + url.search, origin);
    
    const upstreamRequest = new Request(targetUrl.toString(), request);
    // Vercel routes by Host = deployment hostname; custom domain is preserved
    // in x-forwarded-host for app logic.
    upstreamRequest.headers.set('host', new URL(origin).host);
    upstreamRequest.headers.set('x-forwarded-host', url.host);
    upstreamRequest.headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

    const upstreamResponse = await fetch(upstreamRequest, {
      redirect: 'manual',
      // Do not tell the edge to cache before the upstream status and Set-Cookie
      // headers are known. Static assets are served from the explicit R2 path;
      // dynamic responses receive cache directives only after this inspection.
      cf: { cacheEverything: false },
    });

    // Rebuild headers so we can fully control indexing directives.
    // CRITICAL: vercel.json sets X-Robots-Tag: noindex when Host is *.vercel.app.
    // We must set Host to the Vercel origin for routing, so that header would
    // poison apex traffic unless we remove/override it for public hosts.
    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      // Drop every robots tag from origin; re-apply only for non-public hosts.
      if (lower === 'x-robots-tag') return;
      // Avoid hop-by-hop / encoding issues when streaming body as-is.
      if (lower === 'content-encoding' || lower === 'content-length' || lower === 'transfer-encoding') {
        return;
      }
      responseHeaders.append(key, value);
    });
    responseHeaders.set('x-oando-proxy', 'cloudflare-worker');

    const publicHost = url.hostname.toLowerCase().replace(/^www\./, '');
    const extraHosts = (env.PUBLIC_INDEXABLE_HOSTS || '')
      .split(',')
      .map((h) => h.trim().toLowerCase().replace(/^www\./, ''))
      .filter(Boolean);
    const isPublicApex =
      publicHost === 'oando.co.in' ||
      extraHosts.includes(publicHost) ||
      extraHosts.includes(url.hostname.toLowerCase());

    if (isPublicApex) {
      // Explicit allow — do not leave noindex from Vercel preview config.
      responseHeaders.set('X-Robots-Tag', 'all');
      responseHeaders.set('x-oando-indexable', '1');
    } else if (publicHost.endsWith('.vercel.app') || publicHost.endsWith('.workers.dev')) {
      responseHeaders.set('X-Robots-Tag', 'noindex, nofollow');
    }

    const cacheable = shouldCacheResponse({
      method: request.method,
      pathname,
      cookieHeader: request.headers.get('cookie') || '',
      status: upstreamResponse.status,
      setCookie: Boolean(upstreamResponse.headers.get('set-cookie')),
    });
    if (cacheable) {
      responseHeaders.set('cache-control', cacheControlForPath(pathname));
    }

    responseHeaders.set('strict-transport-security', HSTS_HEADER);
    
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders
    });
  }
};
