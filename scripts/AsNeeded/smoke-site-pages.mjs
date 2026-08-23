#!/usr/bin/env node
/** Smoke-check marketing (site) pages — HTTP status + error hints in HTML. */
const base = "http://localhost:3000";

const paths = [
  "/",
  "/about/",
  "/access/",
  "/career/",
  "/choose-product/",
  "/clients/",
  "/compare/",
  "/contact/",
  "/dashboard/",
  "/downloads/",
  "/planning/",
  "/planner/",
  "/planner/features/",
  "/planner/help/",
  "/portal/",
  "/portal/guest/",
  "/privacy/",
  "/products/",
  "/products/seating/",
  "/products/seating/arvo/",
  "/products/category/seating/",
  "/quote-cart/",
  "/refund-and-return-policy/",
  "/service/",
  "/showrooms/",
  "/sitemap/",
  "/solutions/",
  "/solutions/workspaces/",
  "/sustainability/",
  "/terms/",
  "/trusted-by/",
  "/login/",
  "/tools/office-space-calculator/",
  "/tools/meeting-room-capacity-calculator/",
];

const issues = [];

for (const path of paths) {
  const full = path.startsWith("http") ? path : `${base}${path}`;
  try {
    const res = await fetch(full, { redirect: "follow" });
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]*)</i)?.[1]?.trim() ?? "";
    const bad =
      res.status >= 400 ||
      /Application error|Internal Server Error|ChunkLoadError|SyntaxError/i.test(html) ||
      title.length === 0;
    const row = { path, status: res.status, title: title.slice(0, 80), ok: !bad };
    if (bad) issues.push(row);
    console.log(`${bad ? "FAIL" : " OK "} ${res.status} ${path} ${title.slice(0, 60)}`);
  } catch (e) {
    issues.push({ path, error: String(e) });
    console.log(`FAIL --- ${path} ${e.message}`);
  }
}

console.log("\n--- summary ---");
console.log(`checked: ${paths.length}, issues: ${issues.length}`);
if (issues.length) console.log(JSON.stringify(issues, null, 2));
process.exit(issues.length ? 1 : 0);
