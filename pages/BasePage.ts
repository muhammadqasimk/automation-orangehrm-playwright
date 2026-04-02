import { Page, Locator } from '@playwright/test';

/**
 * BasePage — shared behaviour for all page objects.
 * Every page class extends this.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a path relative to baseURL */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Wait until the network settles and the page is fully interactive */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /** Return text of the top-right success toast */
  async getToastMessage(): Promise<string> {
    const toast: Locator = this.page.locator('.oxd-toast-content');
    await toast.waitFor({ state: 'visible' });
    return toast.innerText();
  }
}
