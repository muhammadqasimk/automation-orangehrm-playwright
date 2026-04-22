import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly pageHeading: Locator    = this.page.locator('.oxd-topbar-header-breadcrumb-module');
  readonly userDropdown: Locator   = this.page.locator('.oxd-userdropdown-tab');
  readonly logoutMenuItem: Locator = this.page.getByRole('menuitem', { name: 'Logout' });
  readonly sidebarMenu: Locator    = this.page.locator('.oxd-sidepanel-body');

  constructor(page: Page) {
    super(page);
  }


  async logout(): Promise<void> {
    await this.userDropdown.click();
    await this.logoutMenuItem.click();
  }

  async isLoaded(): Promise<boolean> {
    return this.pageHeading.isVisible();
  }
}
