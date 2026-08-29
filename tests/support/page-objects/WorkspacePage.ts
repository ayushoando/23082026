import { expect, type Locator, type Page } from "@playwright/test";

import { assertNoHorizontalOverflow } from "../ui-states/assertNoOverflow";

export interface WorkspacePageOptions {
  readonly route: "/ooplanner" | "/oostudio";
  readonly rootSelector: ".ooplanner-root" | ".oostudio-root";
}

export class WorkspacePage {
  readonly page: Page;
  readonly options: WorkspacePageOptions;

  constructor(page: Page, options: WorkspacePageOptions) {
    this.page = page;
    this.options = options;
  }

  get root(): Locator {
    return this.page.locator(this.options.rootSelector);
  }

  get dock(): Locator {
    return this.root.getByTestId("dock-shell");
  }

  async goto(): Promise<void> {
    await this.page.goto(this.options.route);
    await expect(this.root).toBeVisible();
  }

  async assertContained(): Promise<void> {
    await assertNoHorizontalOverflow(this.page);
    await assertNoHorizontalOverflow(this.root);
  }
}
