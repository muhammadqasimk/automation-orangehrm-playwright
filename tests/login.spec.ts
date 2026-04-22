import { test, expect } from '../fixtures/index';
import { LoginData } from '../test-data/login.data';
import { LoginPage } from '../pages/LoginPage';

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1 — Functional, Security, Boundary
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login / Authentication', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // TC-LOG-001: Valid login
  test('TC-LOG-001: valid credentials redirect to dashboard', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(page.locator('.oxd-topbar-header-breadcrumb-module')).toContainText('Dashboard');
  });

  // TC-LOG-002: Invalid username
  test('TC-LOG-002: invalid username shows error and stays on login page', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.invalidCredentials.username, LoginData.validAdmin.password);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/login/);
  });

  // TC-LOG-003: Invalid password
  test('TC-LOG-003: invalid password shows error and stays on login page', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.invalidCredentials.password);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/login/);
  });

  // TC-LOG-004: Empty username
  test('TC-LOG-004: empty username shows Required validation message', async ({ loginPage }) => {
    await loginPage.passwordInput.fill(LoginData.validAdmin.password);
    await loginPage.loginButton.click();
    await expect(loginPage.usernameError).toBeVisible();
    await expect(loginPage.usernameError).toHaveText('Required');
  });

  // TC-LOG-005: Empty password
  test('TC-LOG-005: empty password shows Required validation message', async ({ loginPage }) => {
    await loginPage.usernameInput.fill(LoginData.validAdmin.username);
    await loginPage.loginButton.click();
    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.passwordError).toHaveText('Required');
  });

  // TC-LOG-006: Both fields empty
  test('TC-LOG-006: both empty fields show Required messages simultaneously', async ({ loginPage }) => {
    await loginPage.loginButton.click();
    await expect(loginPage.usernameError).toHaveText('Required');
    await expect(loginPage.passwordError).toHaveText('Required');
  });

  // TC-LOG-007: Password masking
  test('TC-LOG-007: password field masks typed characters', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('TestPassword123');
    const inputType = await loginPage.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  // TC-LOG-008: Forgot password navigation
  test('TC-LOG-008: Forgot password link navigates to reset page', async ({ loginPage, page }) => {
    await loginPage.clickForgotPassword();
    await expect(page).toHaveURL(/requestPasswordResetCode/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('.orangehrm-forgot-password-button--reset')).toBeVisible();
  });

  // TC-LOG-010: No user enumeration on password reset
  test('TC-LOG-010: unregistered email returns same response — prevents user enumeration', async ({ forgotPasswordPage, page }) => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.submitResetRequest(LoginData.resetPassword.unregisteredEmail);
    // Reset form button must disappear — page moved to confirmation state
    await expect(page.locator('.orangehrm-forgot-password-button--reset')).not.toBeVisible();
    await expect(page).not.toHaveURL(/requestPasswordResetCode/);
  });

  // TC-LOG-011: SQL injection
  test('TC-LOG-011: SQL injection in username field is rejected gracefully', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.sqlInjection.username, LoginData.sqlInjection.password);
    await expect(page).not.toHaveURL(/dashboard/);
    await expect(page.getByText(/SQL|syntax error|database|ORA-|mysql_/i)).not.toBeVisible();
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
  });

  // TC-LOG-012: XSS payload in username
  test('TC-LOG-012: XSS payload in username is not executed', async ({ loginPage, page }) => {
    let dialogFired = false;
    page.on('dialog', async dialog => {
      dialogFired = true;
      await dialog.dismiss();
    });
    await loginPage.login(LoginData.xssPayload.username, LoginData.xssPayload.password);
    await expect(page).not.toHaveURL(/dashboard/);
    expect(dialogFired, 'XSS payload triggered a JS dialog — vulnerability confirmed').toBe(false);
    await expect(loginPage.errorAlert.or(loginPage.usernameError)).toBeVisible();
  });

  // TC-LOG-013: Excessive character input — BUG-001
  test('TC-LOG-013: excessive input — Login button must remain visible and enabled', async ({ loginPage }) => {
    await loginPage.usernameInput.fill(LoginData.excessiveInput.username);
    await loginPage.passwordInput.fill(LoginData.excessiveInput.password);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
  });

  // TC-LOG-014: Whitespace in username — BUG-006
  // test.fail() = expected to fail, confirms BUG-006 is still open
  test('TC-LOG-014: username with leading/trailing spaces should login successfully — BUG-006', async ({ loginPage, page }) => {
    test.fail();
    await loginPage.login(LoginData.usernameWithSpaces.username, LoginData.usernameWithSpaces.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

  // TC-LOG-015: Successful logout
  test('TC-LOG-015: logout redirects to login page', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    await dashboardPage.logout();
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.usernameInput).toBeVisible();
  });

  // TC-LOG-016: Browser back after logout
  test('TC-LOG-016: browser back after logout does not restore authenticated session', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    await dashboardPage.logout();
    await page.waitForURL(/login/);
    await page.goBack();
    await expect(page).toHaveURL(/login/);
  });

  // TC-LOG-017: Session persists after refresh
  test('TC-LOG-017: session persists after page refresh', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(page.locator('.oxd-topbar-header-breadcrumb-module')).toContainText('Dashboard');
  });

  // TC-LOG-020: Generic error — no field-level disclosure
  test('TC-LOG-020: error message is generic and does not reveal which field is wrong', async ({ loginPage }) => {
    await loginPage.login(LoginData.invalidCredentials.username, LoginData.invalidCredentials.password);
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    const alertText = await loginPage.errorAlert.innerText();
    expect(alertText.toLowerCase()).not.toContain('username not found');
    expect(alertText.toLowerCase()).not.toContain('incorrect password');
    expect(alertText.toLowerCase()).not.toContain('wrong password');
  });

  // TC-LOG-021: No minimum password length — BUG-002
  test('TC-LOG-021: single-character password triggers no field validation — BUG-002', async ({ loginPage }) => {
    await loginPage.login(LoginData.weakPassword.username, LoginData.weakPassword.password);
    // BUG-002: no min-length validation — only "Invalid credentials" alert appears, no field error
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.passwordError).not.toBeVisible();
  });

  // TC-LOG-023: No account lockout — BUG-004 (Critical)
  // test.fail() = expected to fail, confirms BUG-004 is still open
  test('TC-LOG-023: account is not locked after 6 failed attempts — BUG-004', async ({ loginPage, page }) => {
    test.skip(!!process.env.CI, 'skipped in CI — requires 6 sequential login attempts (150 s)');
    test.fail();
    test.setTimeout(150_000);
    const attacker = { username: LoginData.validAdmin.username, password: 'WrongPass!99' };
    for (let attempt = 1; attempt <= 6; attempt++) {
      await loginPage.clearAndLogin(attacker.username, attacker.password);
      await expect(loginPage.errorAlert).toBeVisible();
      await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    }
    await expect(
      page.getByText(/locked|too many|account disabled/i),
      'Account lockout was not triggered after 6 failed attempts'
    ).toBeVisible({ timeout: 3_000 });
  });

  // TC-LOG-024: Wrong HTTP status on failed login — BUG-005
  // test.fail() = expected to fail, confirms BUG-005 is still open
  test('TC-LOG-024: failed login must return HTTP 401, not 302 — BUG-005', async ({ loginPage, page }) => {
    test.fail();
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        res => res.request().method() === 'POST' && res.url().includes('/web/index.php/auth/')
      ),
      loginPage.login(LoginData.invalidCredentials.username, LoginData.invalidCredentials.password),
    ]);
    expect(
      loginResponse.status(),
      `Expected HTTP 401 but got ${loginResponse.status()} from ${loginResponse.url()}`
    ).toBe(401);
  });

  // TC-LOG-025: Username case sensitivity — BUG-007
  test('TC-LOG-025: lowercase "admin" should log in — BUG-007', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.lowercaseUsername.username, LoginData.lowercaseUsername.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2 — Mobile Viewport
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login / Mobile Viewport', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // TC-LOG-019: Mobile responsiveness
  test('TC-LOG-019: all login elements are visible on mobile viewport (393x851)', async ({ loginPage, page }) => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3 — Performance and Network Security
// Self-navigating — no shared beforeEach to avoid polluting timing
// Skipped in CI — these tests each carry a 120 s timeout that inflates
// the CI run time significantly; run locally for full security coverage.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login / Performance and Network Security', () => {
  test.skip(!!process.env.CI, 'skipped in CI — 120 s per test; run locally for full coverage');

  // TC-LOG-027: Password not exposed in request URL
  test('TC-LOG-027: login request uses POST and password is not in the URL', async ({ page }) => {
    test.setTimeout(120_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const [request] = await Promise.all([
      page.waitForRequest(
        req => req.method() === 'POST' && req.url().includes('/web/index.php/auth/')
      ),
      loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password),
    ]);
    expect(request.url()).not.toContain(LoginData.validAdmin.password);
    expect(request.method()).toBe('POST');
  });

  // TC-LOG-028: Login served over HTTPS
  test('TC-LOG-028: login page is served over HTTPS', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/web/index.php/auth/login');
    expect(page.url(), 'Login page is NOT served over HTTPS').toMatch(/^https:\/\//);
  });

  // TC-LOG-029: No credentials in URL after login
  test('TC-LOG-029: credentials do not appear in the URL after successful login', async ({ page }) => {
    test.setTimeout(120_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    const url = page.url();
    expect(url).not.toContain(LoginData.validAdmin.username);
    expect(url).not.toContain(LoginData.validAdmin.password);
  });

  // TC-LOG-030: Browser tab title
  test('TC-LOG-030: login page browser tab title contains OrangeHRM', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/web/index.php/auth/login');
    await expect(page).toHaveTitle(/OrangeHRM/i);
  });

});
