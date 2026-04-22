import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ─── Locators — based on actual DOM ───────────────────────────────────────
  // DOM: <input name="username" placeholder="Username" class="oxd-input ...">
  readonly usernameInput: Locator = this.page.locator('input[name="username"]');

  // DOM: <input name="password" type="password" placeholder="Password" class="oxd-input ...">
  readonly passwordInput: Locator = this.page.locator('input[name="password"]');

  // DOM: <button type="submit" class="oxd-button ... orangehrm-login-button">Login</button>
  readonly loginButton: Locator = this.page.locator('button.orangehrm-login-button');

  // DOM: <span class="oxd-text oxd-text--span oxd-input-field-error-message oxd-input-group__message">Required</span>
  // Scoped to the input-group that contains each field to distinguish username vs password error
  readonly usernameError: Locator = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.locator('input[name="username"]') })
    .locator('.oxd-input-field-error-message');

  readonly passwordError: Locator = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.locator('input[name="password"]') })
    .locator('.oxd-input-field-error-message');

  // DOM: <p class="oxd-text oxd-text--p oxd-alert-content-text">Invalid credentials</p>
  readonly errorAlert: Locator = this.page.locator('.oxd-alert-content-text');

  // DOM: <p class="oxd-text oxd-text--p orangehrm-login-forgot-header">Forgot your password? </p>
  readonly forgotPasswordLink: Locator = this.page.locator('.orangehrm-login-forgot-header');

  constructor(page: Page) {
    super(page);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/web/index.php/auth/login');
    // wait for Vue to mount inputs — page resolves on 'load' but SPA renders after
    await this.usernameInput.waitFor({ state: 'visible' });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAsAdmin(): Promise<void> {
    await this.login(
      process.env.ADMIN_USERNAME ?? 'Admin',
      process.env.ADMIN_PASSWORD ?? 'admin123'
    );
  }

  async clearAndLogin(username: string, password: string): Promise<void> {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
    await this.login(username, password);
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}
