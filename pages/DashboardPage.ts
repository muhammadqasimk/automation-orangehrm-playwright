import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // ─── Locators — based on actual DOM ──────────────────────────────────────

  // DOM: <h6 class="oxd-text oxd-text--h6 oxd-topbar-header-breadcrumb-module">Dashboard</h6>
  readonly pageHeading: Locator    = this.page.locator('.oxd-topbar-header-breadcrumb-module');

  // ─── NEEDS DOM — please provide HTML for these elements ──────────────────
  // 1. User dropdown (top-right avatar/name that opens logout menu)
  // 2. Logout menu item
  readonly userDropdown: Locator   = this.page.locator('.oxd-userdropdown-tab');
  readonly logoutMenuItem: Locator = this.page.getByRole('menuitem', { name: 'Logout' });
  readonly sidebarMenu: Locator    = this.page.locator('.oxd-sidepanel-body');

  constructor(page: Page) {
    super(page);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    await this.userDropdown.click();
    await this.logoutMenuItem.click();
  }

  async isLoaded(): Promise<boolean> {
    return this.pageHeading.isVisible();
  }
}
