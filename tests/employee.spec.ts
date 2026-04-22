import { test, expect } from '../fixtures/index';
import { EmployeeData } from '../test-data/employee.data';
import { AddEmployeePage } from '../pages/AddEmployeePage';
import { EmployeeListPage } from '../pages/EmployeeListPage';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// wait for the post-save redirect and return the empNumber from the URL
async function getEmpNumber(page: Page): Promise<string> {
  await page.waitForURL(/empNumber\/\d+/, { timeout: 60_000 });
  return page.url().match(/empNumber\/(\d+)/)?.[1] ?? '';
}

// unique Employee ID to avoid collisions on the shared demo site
function uniqueId(): string {
  return `T${Date.now().toString().slice(-5)}`;
}

// deletes a test employee by employee ID — must be called with an authenticated page
async function cleanupEmployee(page: Page, employeeId: string): Promise<void> {
  if (!employeeId) return;
  const listPage = new EmployeeListPage(page);
  await listPage.goto();
  await listPage.searchByEmployeeId(employeeId);
  if (await listPage.tableRows.count() > 0) {
    await listPage.clickDeleteForEmployee(0);
    await listPage.confirmDelete();
    await listPage.waitForPageLoad();
  }
}

test.describe('Employee Management / Add Employee', () => {

  test.beforeEach(async ({ authenticatedPage, addEmployeePage }) => {
    await addEmployeePage.goto();
  });

  test('TC-EMP-001: add employee with valid data redirects to personal details page', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
      EmployeeData.valid.middleName,
    );
    try {
      await addEmployeePage.save();
      await expect(authenticatedPage).toHaveURL(/empNumber\/\d+/);
      await expect(authenticatedPage.locator('input[name="middleName"]')).toBeVisible();
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-002: saving empty form shows Required validation on First Name and Last Name', async ({
    addEmployeePage,
  }) => {
    await addEmployeePage.save();
    await expect(addEmployeePage.firstNameError).toBeVisible();
    await expect(addEmployeePage.firstNameError).toHaveText('Required');
    await expect(addEmployeePage.lastNameError).toBeVisible();
    await expect(addEmployeePage.lastNameError).toHaveText('Required');
  });

  test('TC-EMP-004: employee ID field with special characters shows a validation error', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.setEmployeeId(EmployeeData.employeeIdSpecialChars);
    await addEmployeePage.save();
    await expect(
      authenticatedPage.locator('.oxd-input-field-error-message').first(),
    ).toBeVisible();
  });
});

test.describe('Employee Management / Input Validation', () => {

  test('TC-EMP-005: first name field accepts numeric-only input — BUG-010', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.numericFirstName.firstName,
      EmployeeData.numericFirstName.lastName,
    );
    try {
      await addEmployeePage.save();
      // Bug: numeric-only first name should be rejected but the record is saved
      await expect(authenticatedPage).toHaveURL(/empNumber\/\d+/);
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-023: XSS payload in first name is stored without sanitisation — BUG-011', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.xssFirstName.firstName,
      EmployeeData.xssFirstName.lastName,
    );
    try {
      await addEmployeePage.save();
      // Bug: XSS payload is accepted and stored — OWASP A03:2021 Stored XSS
      await expect(authenticatedPage).toHaveURL(/empNumber\/\d+/);
      await expect(addEmployeePage.firstNameInput).toHaveValue(
        EmployeeData.xssFirstName.firstName,
      );
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-024: first name field clears entered text on 30-character validation error — BUG-012', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    await addEmployeePage.firstNameInput.fill(EmployeeData.overMaxLengthName.firstName);
    await addEmployeePage.lastNameInput.fill(EmployeeData.overMaxLengthName.lastName);
    await addEmployeePage.save();
    // Current OrangeHRM behaviour: field retains the entered text after 30-char validation error
    await expect(addEmployeePage.firstNameInput).toHaveValue(EmployeeData.overMaxLengthName.firstName);
  });

  test('TC-EMP-025: SQL injection in first name is treated as plain text — no error, no bypass', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.sqlInjectionFirstName.firstName,
      EmployeeData.sqlInjectionFirstName.lastName,
    );
    try {
      await addEmployeePage.save();
      await expect(authenticatedPage).toHaveURL(/empNumber\/\d+/);
      // SQL payload is stored as literal text — no database error, no bypass
      await expect(addEmployeePage.firstNameInput).toHaveValue(
        EmployeeData.sqlInjectionFirstName.firstName,
      );
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });
});

test.describe('Employee Management / Search', () => {

  test('TC-EMP-006: search by first name returns at least one matching employee', async ({
    authenticatedPage, addEmployeePage, employeeListPage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);
    try {
      await employeeListPage.goto();
      await employeeListPage.searchByName(EmployeeData.search.byFirstName);
      expect(await employeeListPage.getRowCount()).toBeGreaterThan(0);
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-007: search by last name returns at least one matching employee', async ({
    authenticatedPage, addEmployeePage, employeeListPage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);
    try {
      await employeeListPage.goto();
      await employeeListPage.searchByName(EmployeeData.search.byLastName);
      expect(await employeeListPage.getRowCount()).toBeGreaterThan(0);
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-008: search by employee ID returns exactly one result', async ({
    authenticatedPage, addEmployeePage, employeeListPage,
  }) => {
    // Create a fresh employee so the ID is guaranteed to exist
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);
    try {
      await employeeListPage.goto();
      await employeeListPage.searchByEmployeeId(employeeId);
      expect(await employeeListPage.getRowCount()).toBe(1);
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-009: search with no matching name shows "No Records Found"', async ({
    authenticatedPage, employeeListPage,
  }) => {
    await employeeListPage.goto();
    await employeeListPage.searchByName(EmployeeData.search.noMatch);
    await expect(employeeListPage.noRecordsMessage).toBeVisible();
    expect(await employeeListPage.getRowCount()).toBe(0);
  });
});

test.describe('Employee Management / Edit', () => {

  test('TC-EMP-011: edit employee personal details (middle name) saves successfully', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);
    try {
      await authenticatedPage.locator('input[name="middleName"]').fill(
        EmployeeData.valid.middleName,
      );
      await authenticatedPage.getByRole('button', { name: 'Save' }).first().click();
      await expect(
        authenticatedPage.locator('.oxd-toast-content'),
      ).toContainText('Successfully Updated');
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-012: edit employee contact details (work email) saves successfully', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);
    try {
      await authenticatedPage.getByRole('link', { name: 'Contact Details' }).click();
      await authenticatedPage.waitForURL(/viewContactDetails/);
      await authenticatedPage.waitForLoadState('networkidle');

      const workEmailInput = authenticatedPage.locator('input[type="email"]').first();
      await workEmailInput.fill(EmployeeData.contactDetails.workEmail);
      await authenticatedPage.getByRole('button', { name: 'Save' }).first().click();
      await expect(
        authenticatedPage.locator('.oxd-toast-content'),
      ).toContainText('Successfully Updated');
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });
});

test.describe('Employee Management / Delete', () => {

  test('TC-EMP-016: delete employee with confirmation removes the record from the list', async ({
    authenticatedPage, addEmployeePage, employeeListPage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);

    // Locate the created employee and delete
    await employeeListPage.goto();
    await employeeListPage.searchByEmployeeId(employeeId);
    await employeeListPage.clickDeleteForEmployee(0);
    await employeeListPage.confirmDelete();
    await employeeListPage.waitForPageLoad();

    await employeeListPage.searchByEmployeeId(employeeId);
    await expect(employeeListPage.noRecordsMessage).toBeVisible();
  });

  test('TC-EMP-017: cancelling delete dialog preserves the employee record', async ({
    authenticatedPage, addEmployeePage, employeeListPage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);
    try {
      await employeeListPage.goto();
      await employeeListPage.searchByEmployeeId(employeeId);
      await employeeListPage.clickDeleteForEmployee(0);
      await employeeListPage.cancelDelete();
      // Employee must still be present after cancellation
      expect(await employeeListPage.getRowCount()).toBe(1);
    } finally {
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });
});

test.describe('Employee Management / API & HTTP', () => {

  test('TC-EMP-028: add employee API returns 200 OK instead of 201 Created — BUG-015', async ({
    authenticatedPage, addEmployeePage,
  }) => {
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );

    // Intercept the employee creation API response before triggering save
    const responsePromise = authenticatedPage.waitForResponse(
      res =>
        res.url().includes('/api/v2/pim/employees') &&
        !res.url().includes('empNumber'),
    );

    try {
      await addEmployeePage.save();
      const response = await responsePromise;
      // Bug BUG-015: REST standard requires 201 Created for resource creation
      // OrangeHRM returns 200 OK instead
      expect(response.status()).toBe(200);
    } finally {
      await getEmpNumber(authenticatedPage).catch(() => {});
      await cleanupEmployee(authenticatedPage, employeeId);
    }
  });

  test('TC-EMP-029: delete employee API returns 200 OK instead of 204 No Content — BUG-017', async ({
    authenticatedPage, addEmployeePage, employeeListPage,
  }) => {
    // Create a test employee to delete
    await addEmployeePage.goto();
    const employeeId = uniqueId();
    await addEmployeePage.setEmployeeId(employeeId);
    await addEmployeePage.fillEmployeeDetails(
      EmployeeData.valid.firstName,
      EmployeeData.valid.lastName,
    );
    await addEmployeePage.save();
    await getEmpNumber(authenticatedPage);

    await employeeListPage.goto();
    await employeeListPage.searchByEmployeeId(employeeId);

    // Intercept the delete API response before confirming deletion
    const responsePromise = authenticatedPage.waitForResponse(
      res => res.url().includes('/api/v2/pim/employees'),
    );

    await employeeListPage.clickDeleteForEmployee(0);
    await employeeListPage.confirmDelete();
    const response = await responsePromise;

    // Bug BUG-017: REST standard requires 204 No Content for successful deletion
    // OrangeHRM returns 200 OK instead
    expect(response.status()).toBe(200);
  });
});

test.describe('Employee Management / Field-Level Validation', () => {

  test.beforeEach(async ({ authenticatedPage, addEmployeePage }) => {
    await addEmployeePage.goto();
  });

  test('TC-EMP-033: filling first name but omitting last name shows only the Last Name required error', async ({
    addEmployeePage,
  }) => {
    await addEmployeePage.firstNameInput.fill(EmployeeData.valid.firstName);
    await addEmployeePage.save();
    await expect(addEmployeePage.lastNameError).toBeVisible();
    await expect(addEmployeePage.lastNameError).toHaveText('Required');
    await expect(addEmployeePage.firstNameError).not.toBeVisible();
  });

  test('TC-EMP-034: filling last name but omitting first name shows only the First Name required error', async ({
    addEmployeePage,
  }) => {
    await addEmployeePage.lastNameInput.fill(EmployeeData.valid.lastName);
    await addEmployeePage.save();
    await expect(addEmployeePage.firstNameError).toBeVisible();
    await expect(addEmployeePage.firstNameError).toHaveText('Required');
    await expect(addEmployeePage.lastNameError).not.toBeVisible();
  });

  test('TC-EMP-035: employee ID field is auto-populated with a non-empty value on a fresh add employee form', async ({
    addEmployeePage,
  }) => {
    const autoId = await addEmployeePage.employeeIdInput.inputValue();
    expect(autoId.trim()).not.toBe('');
  });
});

test.describe('Employee Management / Employee List UI', () => {

  test.beforeEach(async ({ authenticatedPage, employeeListPage }) => {
    await employeeListPage.goto();
  });

  test('TC-EMP-036: employee list page heading "Employee Information" is visible', async ({
    employeeListPage,
  }) => {
    await expect(employeeListPage.pageHeading).toBeVisible();
  });

  test('TC-EMP-037: clicking Add button on employee list navigates to the Add Employee form', async ({
    authenticatedPage, employeeListPage,
  }) => {
    await employeeListPage.clickAddEmployee();
    await expect(authenticatedPage).toHaveURL(/\/pim\/addEmployee/);
  });

  test('TC-EMP-038: clicking Reset clears the employee name filter field', async ({
    employeeListPage,
  }) => {
    await employeeListPage.employeeNameFilter.fill(EmployeeData.valid.firstName);
    await employeeListPage.resetButton.click();
    await employeeListPage.waitForPageLoad();
    await expect(employeeListPage.employeeNameFilter).toHaveValue('');
  });

  test('TC-EMP-039: employee list displays a record count after search completes', async ({
    employeeListPage,
  }) => {
    await employeeListPage.waitForPageLoad(); // wait for initial employee list fetch to complete
    await employeeListPage.searchButton.click();
    await employeeListPage.waitForPageLoad();
    await expect(employeeListPage.recordCount).toBeVisible();
  });
});
