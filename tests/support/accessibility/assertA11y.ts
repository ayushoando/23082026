import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export interface AccessibilityOptions {
  readonly include?: string;
  readonly disableRules?: readonly string[];
}

export async function assertNoSeriousAccessibilityViolations(
  page: Page,
  options: AccessibilityOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page });
  if (options.include) builder = builder.include(options.include);
  if (options.disableRules?.length) builder = builder.disableRules([...options.disableRules]);
  const result = await builder.analyze();
  const blocking = result.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}
