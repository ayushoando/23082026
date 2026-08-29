// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function read(relative: string): string {
  return fs.readFileSync(path.join(repositoryRoot, relative), "utf8");
}

describe("FOCSS Dockview and Tailwind contracts", () => {
  it.each([
    ["Planner", "site/focss/planner/dock.css", ".ooplanner-root"],
    ["Studio", "site/focss/studio/dock.css", ".oostudio-root"],
  ])("keeps %s dock geometry contained while allowing deliberate floating overflow", (_name, file, root) => {
    const css = read(file);
    expect(css).toContain(`${root} .ff-workspace-dock`);
    expect(css).toMatch(/min-height:\s*0/);
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).toContain(".dv-content-container");
    expect(css).toMatch(/overflow:\s*auto/);
    expect(css).toContain(".dv-floating-overlay-host");
    expect(css).toMatch(/width:\s*100vw\s*!important/);
    expect(css).toMatch(/height:\s*100vh\s*!important/);
  });

  it("keeps Tailwind scanning centralized and loads each fork dock sheet last", () => {
    const scan = read("site/focss/base/scan.css");
    const planner = read("site/focss/planner/entry.css").trim();
    const studio = read("site/focss/studio/entry.css").trim();
    expect(scan).toContain('@import "tailwindcss"');
    for (const source of ["app", "features", "components", "lib"]) {
      expect(scan).toContain(`@source "../../${source}/**/*.{ts,tsx,js,jsx}"`);
    }
    expect(planner.endsWith('@import "./dock.css";')).toBe(true);
    expect(studio.endsWith('@import "./dock.css";')).toBe(true);
  });
});
