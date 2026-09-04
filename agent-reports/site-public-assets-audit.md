# Static Public Assets & SEO Metadata (`site/public/`) Subsystem Audit

**Date:** 2026-09-04  
**Target:** [`site/public/`](file:///d:/23082026/site/public/)  
**Role:** Static File Serving, PWA Manifests, Search Engine Verification & AI Crawler Protocols

---

## Executive Summary

The [`site/public/`](file:///d:/23082026/site/public/) directory contains all **uncompiled static files and metadata assets** served directly at the root of the domain. It manages search engine verification, PWA manifest configurations, RFC 9116 security disclosures, local media fallbacks, and the modern [`llms.txt`](file:///d:/23082026/site/public/llms.txt) machine-readable AI crawler manifest.

```
site/public/ Architecture:
├── site.webmanifest         # Progressive Web App (PWA) manifest (standalone, theme colors, icons)
├── llms.txt                 # Modern machine-readable AI agent & LLM crawler discovery manifest
├── security.txt & .well-known/ # RFC 9116 security vulnerability disclosure contact
├── BingSiteAuth.xml         # Bing Webmaster search engine verification token
├── favicon.ico              # Root browser favicon
├── icon-192.png, icon-512.png # PWA launch icons
├── logo.webp & logo-v2.webp # Primary WebP brand vector logos
└── assets/ & images/        # Local disk fallback media (Production serves from Cloudflare R2)
```

---

## 1. Key Manifests & Specifications

### 1.1 AI Crawler Discovery (`site/public/llms.txt`)
File: [`site/public/llms.txt`](file:///d:/23082026/site/public/llms.txt)
* Implements the standardized `/llms.txt` protocol for AI agents (OpenAI Search, Gemini, Perplexity).
* Declares brand aliases (`One&Only`, `One and Only Furniture`, `One and Only Patna`).
* Specifies crawl policy: encourages indexing of public product categories while explicitly forbidding AI crawl bots from scraping private/canvas application shells (`/ooplanner/`, `/oostudio/`, `/admin/`, `/portal/`).
* Provides verified corporate office details: Jagat Trade Centre, Frazer Road, Patna, Bihar.

### 1.2 Progressive Web App Manifest (`site.webmanifest`)
* Configures standalone PWA behavior:
  ```json
  {
    "name": "One&Only",
    "short_name": "Oando",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#111827",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
* Integrated with [`site/components/pwa/ServiceWorkerRegister.tsx`](file:///d:/23082026/site/components/pwa/ServiceWorkerRegister.tsx).

### 1.3 RFC 9116 Security Disclosure (`security.txt`)
* Provides responsible disclosure contact (`mailto:sales@oando.co.in`, `tel:+91-98356-30940`).
* Served at `https://oando.co.in/.well-known/security.txt`.
* Edge proxy in `workers/oando-worker-proxy/src/index.js` intercepts this route at Cloudflare edge, returning HTTP 200 with a 24-hour cache TTL before requests ever reach Vercel.

---

## 2. Production Edge CDN Relationship

While `site/public/assets/` and `site/public/images/` exist on disk as development fallbacks, **production traffic never reads media from Vercel disk**. 
The Cloudflare Worker proxy (`oando-worker-proxy`) intercepts all requests prefixed with `/assets/` or `/images/` and resolves them directly against Cloudflare R2 bucket `oando-asset-cdn`, protecting Vercel from static bandwidth charges.
