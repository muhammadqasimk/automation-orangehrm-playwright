import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { LeavePage } from '../pages/LeavePage';
import { RecruitmentPage } from '../pages/RecruitmentPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
  leavePage: LeavePage;
  recruitmentPage: RecruitmentPage;
  forgotPasswordPage: ForgotPasswordPage;
  // pre-authenticated page — skips login for tests that don't test auth
  authenticatedPage: Page;
};

export const test = base.extend<PageFixtures>({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  employeeListPage: async ({ page }, use) => {
    await use(new EmployeeListPage(page));
  },

  addEmployeePage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },

  leavePage: async ({ page }, use) => {
    await use(new LeavePage(page));
  },

  recruitmentPage: async ({ page }, use) => {
    await use(new RecruitmentPage(page));
  },

  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },

  /**
   * Provides a page that is already logged in as Admin.
   * Use this fixture in any test that tests functionality beyond login —
   * avoids repeating the login flow in every test.
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    // URL: https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index
    await page.waitForURL(/\/dashboard\/index/);
    await use(page);
  },
});

export { expect } from '@playwright/test';
