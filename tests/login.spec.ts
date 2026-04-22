import { test, expect } from '../fixtures/index';
import { LoginData } from '../test-data/login.data';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login / Authentication', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC-LOG-001: valid credentials redirect to dashboard', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(page.locator('.oxd-topbar-header-breadcrumb-module')).toContainText('Dashboard');
  });

  test('TC-LOG-002: invalid username shows error and stays on login page', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.invalidCredentials.username, LoginData.validAdmin.password);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/login/);
  });

  test('TC-LOG-003: invalid password shows error and stays on login page', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.invalidCredentials.password);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/login/);
  });

  test('TC-LOG-004: empty username shows Required validation message', async ({ loginPage }) => {
    await loginPage.passwordInput.fill(LoginData.validAdmin.password);
    await loginPage.loginButton.click();
    await expect(loginPage.usernameError).toBeVisible();
    await expect(loginPage.usernameError).toHaveText('Required');
  });

  test('TC-LOG-005: empty password shows Required validation message', async ({ loginPage }) => {
    await loginPage.usernameInput.fill(LoginData.validAdmin.username);
    await loginPage.loginButton.click();
    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.passwordError).toHaveText('Required');
  });

  test('TC-LOG-006: both empty fields show Required messages simultaneously', async ({ loginPage }) => {
    await loginPage.loginButton.click();
    await expect(loginPage.usernameError).toHaveText('Required');
    await expect(loginPage.passwordError).toHaveText('Required');
  });

  test('TC-LOG-007: password field masks typed characters', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('TestPassword123');
    const inputType = await loginPage.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('TC-LOG-008: Forgot password link navigates to reset page', async ({ loginPage, page }) => {
    await loginPage.clickForgotPassword();
    await expect(page).toHaveURL(/requestPasswordResetCode/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('.orangehrm-forgot-password-button--reset')).toBeVisible();
  });

  test('TC-LOG-010: unregistered email returns same response — prevents user enumeration', async ({ forgotPasswordPage, page }) => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.submitResetRequest(LoginData.resetPassword.unregisteredEmail);
    await expect(page.locator('.orangehrm-forgot-password-button--reset')).not.toBeVisible();
    await expect(page).not.toHaveURL(/requestPasswordResetCode/);
  });

  test('TC-LOG-011: SQL injection in username field is rejected gracefully', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.sqlInjection.username, LoginData.sqlInjection.password);
    await expect(page).not.toHaveURL(/dashboard/);
    await expect(page.getByText(/SQL|syntax error|database|ORA-|mysql_/i)).not.toBeVisible();
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
  });

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

  test('TC-LOG-013: excessive input — Login button must remain visible and enabled', async ({ loginPage }) => {
    await loginPage.usernameInput.fill(LoginData.excessiveInput.username);
    await loginPage.passwordInput.fill(LoginData.excessiveInput.password);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('TC-LOG-014: username with leading/trailing spaces should login successfully — BUG-006', async ({ loginPage, page }) => {
    test.fail();
    await loginPage.login(LoginData.usernameWithSpaces.username, LoginData.usernameWithSpaces.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

  test('TC-LOG-015: logout redirects to login page', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    await dashboardPage.logout();
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('TC-LOG-016: browser back after logout does not restore authenticated session', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    await dashboardPage.logout();
    await page.waitForURL(/login/);
    await page.goBack();
    await expect(page).toHaveURL(/login/);
  });

  test('TC-LOG-017: session persists after page refresh', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await page.waitForURL(/\/dashboard\/index/);
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard\/index/);
    await expect(page.locator('.oxd-topbar-header-breadcrumb-module')).toContainText('Dashboard');
  });

  test('TC-LOG-020: error message is generic and does not reveal which field is wrong', async ({ loginPage }) => {
    await loginPage.login(LoginData.invalidCredentials.username, LoginData.invalidCredentials.password);
    await expect(loginPage.errorAlert).toContainText('Invalid credentials');
    const alertText = await loginPage.errorAlert.innerText();
    expect(alertText.toLowerCase()).not.toContain('username not found');
    expect(alertText.toLowerCase()).not.toContain('incorrect password');
    expect(alertText.toLowerCase()).not.toContain('wrong password');
  });

  test('TC-LOG-021: single-character password triggers no field validation — BUG-002', async ({ loginPage }) => {
    await loginPage.login(LoginData.weakPassword.username, LoginData.weakPassword.password);
    // BUG-002: no min-length validation — only "Invalid credentials" alert appears, no field error
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.passwordError).not.toBeVisible();
  });

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

  test('TC-LOG-025: lowercase "admin" should log in — BUG-007', async ({ loginPage, page }) => {
    await loginPage.login(LoginData.lowercaseUsername.username, LoginData.lowercaseUsername.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });

});

test.describe('Login / Mobile Viewport', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC-LOG-019: all login elements are visible on mobile viewport (393x851)', async ({ loginPage, page }) => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await loginPage.login(LoginData.validAdmin.username, LoginData.validAdmin.password);
    await expect(page).toHaveURL(/\/dashboard\/index/);
  });
});

// each test has a 120 s timeout — skipped in CI, run locally for full security coverage
test.describe('Login / Performance and Network Security', () => {
  test.skip(!!process.env.CI, 'skipped in CI — 120 s per test; run locally for full coverage');

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

  test('TC-LOG-028: login page is served over HTTPS', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/web/index.php/auth/login');
    expect(page.url(), 'Login page is NOT served over HTTPS').toMatch(/^https:\/\//);
  });

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

  test('TC-LOG-030: login page browser tab title contains OrangeHRM', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/web/index.php/auth/login');
    await expect(page).toHaveTitle(/OrangeHRM/i);
  });

});
