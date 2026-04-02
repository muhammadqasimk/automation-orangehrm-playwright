import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ForgotPasswordPage extends BasePage {
  // ─── Locators — based on actual DOM ──────────────────────────────────────

  // DOM: <input name="username" placeholder="Username" class="oxd-input oxd-input--active">
  readonly emailInput: Locator = this.page.locator('input[name="username"]');

  // DOM: <button class="... orangehrm-forgot-password-button orangehrm-forgot-password-button--reset">Reset Password</button>
  readonly resetButton: Locator = this.page.locator('.orangehrm-forgot-password-button--reset');

  // DOM: <button class="... orangehrm-forgot-password-button orangehrm-forgot-password-button--cancel">Cancel</button>
  readonly cancelButton: Locator = this.page.locator('.orangehrm-forgot-password-button--cancel');

  // ─── NEEDS DOM — please provide the HTML for these elements ──────────────
  // 1. Success message after submitting reset request
  // 2. Page heading on the reset password page
  readonly successMessage: Locator = this.page.getByText('Reset Password link sent successfully');

  constructor(page: Page) {
    super(page);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/web/index.php/auth/requestPasswordResetCode');
  }

  async submitResetRequest(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.resetButton.click();
  }
}
