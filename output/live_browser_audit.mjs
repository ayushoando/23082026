import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const PAGES_TO_AUDIT = [
  { path: "/", name: "Homepage" },
  { path: "/products", name: "Products Catalog" },
  { path: "/portfolio", name: "Portfolio Case Studies" },
  { path: "/trusted-by", name: "Trusted By Proof" },
  { path: "/clients", name: "Clients Directory" },
  { path: "/about", name: "About Us" },
  { path: "/contact", name: "Contact Us" },
  { path: "/faq", name: "FAQ" },
  { path: "/career", name: "Career" },
  { path: "/showrooms", name: "Showrooms" },
  { path: "/service", name: "After Sales Service" },
  { path: "/sustainability", name: "Sustainability" },
  { path: "/access", name: "Access Sign-In" },
  { path: "/planning", name: "Planning Service" },
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const outputDir = path.resolve("output/playwright/live-audit");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const pageDef of PAGES_TO_AUDIT) {
    const pageUrl = `${BASE_URL}${pageDef.path}`;
    console.log(`\n=== Auditing ${pageDef.name} (${pageDef.path}) ===`);

    const auditData = {
      name: pageDef.name,
      path: pageDef.path,
      desktop: null,
      mobile: null,
    };

    // 1. Desktop Audit (1440x900)
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: "en-IN",
        timezoneId: "Asia/Kolkata",
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const response = await page.goto(pageUrl, { waitUntil: "load", timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);

      // Status
      const status = response?.status() ?? 0;

      // Metadata
      const metadata = await page.evaluate(() => {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.getAttribute("content");
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
        const h1s = Array.from(document.querySelectorAll("h1")).map((h) => h.innerText.trim());
        const hasH1 = h1s.length > 0;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
        const ldJsonCount = document.querySelectorAll('script[type="application/ld+json"]').length;
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth;

        return {
          title,
          description,
          canonical,
          h1s,
          hasH1,
          ogTitle,
          ldJsonCount,
          hasHorizontalOverflow,
          scrollWidth,
          clientWidth,
        };
      });

      // Accessibility Axe Scan
      let axeViolations = [];
      try {
        const axeResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        axeViolations = axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
          sampleNode: v.nodes[0]?.html?.slice(0, 120),
        }));
      } catch (err) {
        console.error("Axe error:", err.message);
      }

      // Screenshot
      const screenshotSlug = pageDef.path.replace(/[^a-z0-9]/gi, "_") || "_home";
      const desktopScreenshot = path.join(outputDir, `${screenshotSlug}-desktop.png`);
      await page.screenshot({ path: desktopScreenshot, fullPage: false });

      auditData.desktop = {
        status,
        consoleErrors,
        metadata,
        axeViolations,
        screenshot: desktopScreenshot,
      };

      await context.close();
    }

    // 2. Mobile Audit (390x844)
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        locale: "en-IN",
        timezoneId: "Asia/Kolkata",
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const response = await page.goto(pageUrl, { waitUntil: "load", timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);

      const status = response?.status() ?? 0;

      // Mobile metrics & chrome layout
      const mobileMetrics = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth;

        // Check mobile bottom tab bar
        const tabNav = document.querySelector(".mobile-tab-bar");
        const tabNavRect = tabNav ? tabNav.getBoundingClientRect() : null;

        // Check cookie consent bar
        const cookieBar = document.querySelector("[data-cookie-consent-bar]");
        const cookieBarRect = cookieBar ? cookieBar.getBoundingClientRect() : null;

        // Check FABs
        const fabs = Array.from(document.querySelectorAll("[data-site-fab], .site-fab-launcher")).map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: r.height, tag: el.tagName };
        });

        // Check small touch targets (< 44px)
        const interactive = Array.from(document.querySelectorAll("button, a[href], input, select"));
        const smallTargets = interactive
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40);
          })
          .map((el) => ({
            tag: el.tagName,
            text: (el.innerText || el.getAttribute("aria-label") || "").slice(0, 30),
            rect: { width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) },
          }))
          .slice(0, 5);

        return {
          hasHorizontalOverflow,
          scrollWidth,
          clientWidth,
          hasBottomTabNav: Boolean(tabNav),
          tabNavHeight: tabNavRect ? Math.round(tabNavRect.height) : 0,
          hasCookieBar: Boolean(cookieBar),
          cookieBarBottom: cookieBarRect ? Math.round(cookieBarRect.bottom) : 0,
          cookieBarHeight: cookieBarRect ? Math.round(cookieBarRect.height) : 0,
          fabsCount: fabs.length,
          smallTargetsCount: smallTargets.length,
          smallTargetsSample: smallTargets,
        };
      });

      // Mobile Accessibility Axe Scan
      let axeViolations = [];
      try {
        const axeResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        axeViolations = axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
          sampleNode: v.nodes[0]?.html?.slice(0, 120),
        }));
      } catch (err) {
        console.error("Axe error:", err.message);
      }

      const screenshotSlug = pageDef.path.replace(/[^a-z0-9]/gi, "_") || "_home";
      const mobileScreenshot = path.join(outputDir, `${screenshotSlug}-mobile.png`);
      await page.screenshot({ path: mobileScreenshot, fullPage: false });

      auditData.mobile = {
        status,
        consoleErrors,
        mobileMetrics,
        axeViolations,
        screenshot: mobileScreenshot,
      };

      await context.close();
    }

    results.push(auditData);
    console.log(`-> Desktop: status ${auditData.desktop.status}, ${auditData.desktop.axeViolations.length} a11y issues, H1: "${auditData.desktop.metadata.h1s[0] || 'NONE'}"`);
    console.log(`-> Mobile: status ${auditData.mobile.status}, ${auditData.mobile.axeViolations.length} a11y issues, overflow: ${auditData.mobile.mobileMetrics.hasHorizontalOverflow}`);
  }

  await browser.close();

  const reportPath = path.resolve("output/playwright/live-audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nAudit complete! Report saved to ${reportPath}`);
}

runAudit().catch((err) => {
  console.error("Fatal error during audit:", err);
  process.exit(1);
});
