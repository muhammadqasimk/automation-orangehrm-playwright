import { test, expect } from '../fixtures/index';
import { RecruitmentData } from '../test-data/recruitment.data';
import { RecruitmentPage } from '../pages/RecruitmentPage';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a unique last name suffix to avoid collisions on the shared demo site. */
function uniqueLastName(): string {
  return `C${Date.now().toString().slice(-5)}`;
}

/** Returns a unique email for each test run. */
function uniqueEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

/**
 * Deletes a test candidate by searching for their unique last name in the
 * candidate list and confirming deletion.
 */
async function cleanupCandidate(page: Page, lastName: string): Promise<void> {
  if (!lastName) return;
  const recruitment = new RecruitmentPage(page);
  await recruitment.gotoCandidates();
  await recruitment.searchCandidateByName(lastName);
  if (await recruitment.tableRows.count() > 0) {
    await recruitment.clickDeleteForCandidate(0);
    await recruitment.confirmDelete();
    await recruitment.waitForPageLoad();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1 — Vacancies UI
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Recruitment / Vacancies UI', () => {

  // TC-REC-001: Vacancies list page loads
  test('TC-REC-001: Vacancies list page loads and table is visible', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    await recruitmentPage.gotoVacancies();
    await expect(authenticatedPage.locator('.oxd-table')).toBeVisible();
  });

  // TC-REC-002: Add Vacancy button navigates to the Add Vacancy form
  test('TC-REC-002: Add Vacancy button navigates to the Add Vacancy form', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    await recruitmentPage.gotoVacancies();
    await recruitmentPage.clickAdd();
    await expect(authenticatedPage).toHaveURL(/addJobVacancy/);
    await expect(recruitmentPage.vacancyNameInput).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2 — Candidates UI & Validation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Recruitment / Candidates UI & Validation', () => {

  // TC-REC-003: Candidates list page loads
  test('TC-REC-003: Candidates list page loads and table is visible', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    await recruitmentPage.gotoCandidates();
    await expect(authenticatedPage.locator('.oxd-table')).toBeVisible();
  });

  // TC-REC-004: Add Candidate form shows required errors when empty
  test('TC-REC-004: empty Add Candidate form shows required errors for first name and last name', async ({
    recruitmentPage,
  }) => {
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.save();
    await expect(recruitmentPage.firstNameError).toBeVisible();
    await expect(recruitmentPage.firstNameError).toHaveText('Required');
    await expect(recruitmentPage.lastNameError).toBeVisible();
    await expect(recruitmentPage.lastNameError).toHaveText('Required');
  });

  // TC-REC-005: Invalid email format shows a validation error
  test('TC-REC-005: invalid email format shows a validation error', async ({
    recruitmentPage,
  }) => {
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.candidateFirstName.fill(RecruitmentData.validCandidate.firstName);
    await recruitmentPage.candidateLastName.fill('Test');
    await recruitmentPage.candidateEmail.fill(RecruitmentData.invalidEmail);
    await recruitmentPage.save();
    await expect(recruitmentPage.emailError).toBeVisible();
  });

  // TC-REC-006: Search with no match shows "No Records Found"
  test('TC-REC-006: searching candidates with a non-existent name shows "No Records Found"', async ({
    recruitmentPage,
  }) => {
    await recruitmentPage.gotoCandidates();
    await recruitmentPage.searchCandidateByName('ZZZNOMATCH99999XYZ');
    await expect(recruitmentPage.noRecordsMessage).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3 — Add Candidate
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Recruitment / Add Candidate', () => {

  // TC-REC-007: Valid candidate saves successfully
  test('TC-REC-007: add candidate with valid data saves successfully', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    const lastName = uniqueLastName();
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.selectFirstAvailableVacancy();
    await recruitmentPage.fillCandidateDetails(
      RecruitmentData.validCandidate.firstName,
      lastName,
      uniqueEmail('valid'),
      RecruitmentData.validCandidate.contactNo,
    );
    try {
      await recruitmentPage.save();
      const toast = authenticatedPage.locator('.oxd-toast-content');
      await expect(toast).toBeVisible({ timeout: 30_000 });
    } finally {
      await cleanupCandidate(authenticatedPage, lastName);
    }
  });

  // TC-REC-009: Stored XSS in candidate first name — BUG-018
  test('TC-REC-009: XSS payload in candidate first name is stored without sanitisation — BUG-018', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    const lastName = uniqueLastName();
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.selectFirstAvailableVacancy();
    await recruitmentPage.fillCandidateDetails(
      RecruitmentData.xssCandidate.firstName,   // XSS payload as first name
      lastName,                                  // clean unique last name for cleanup
      uniqueEmail('xss'),
    );

    let dialogFired = false;
    authenticatedPage.on('dialog', async dialog => {
      dialogFired = true;
      await dialog.dismiss();
    });

    try {
      await recruitmentPage.save();
      // Bug BUG-018: XSS payload is accepted and stored — OWASP A03:2021 Stored XSS
      const toast = authenticatedPage.locator('.oxd-toast-content');
      await expect(toast).toBeVisible({ timeout: 30_000 });
      expect(dialogFired, 'XSS payload triggered a JS dialog — vulnerability confirmed').toBe(false);
    } finally {
      await cleanupCandidate(authenticatedPage, lastName);
    }
  });

  // TC-REC-010: Numeric-only candidate name accepted — BUG-020
  test('TC-REC-010: numeric-only candidate first name is accepted without validation error — BUG-020', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    const lastName = uniqueLastName();
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.selectFirstAvailableVacancy();
    await recruitmentPage.fillCandidateDetails(
      RecruitmentData.numericCandidate.firstName,  // '99999'
      lastName,
      uniqueEmail('numeric'),
    );
    try {
      await recruitmentPage.save();
      // Bug BUG-020: numeric-only name should be rejected but is saved
      const toast = authenticatedPage.locator('.oxd-toast-content');
      await expect(toast).toBeVisible({ timeout: 30_000 });
    } finally {
      await cleanupCandidate(authenticatedPage, lastName);
    }
  });

  // TC-REC-011: Single-digit contact number passes validation — BUG-019
  test('TC-REC-011: single-digit contact number passes validation — BUG-019', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    const lastName = uniqueLastName();
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.selectFirstAvailableVacancy();
    await recruitmentPage.fillCandidateDetails(
      RecruitmentData.shortContactNo.firstName,
      lastName,
      uniqueEmail('short'),
      RecruitmentData.shortContactNo.contactNo,  // '1'
    );
    try {
      await recruitmentPage.save();
      // Bug BUG-019: single-digit contact number passes without min-length validation
      const toast = authenticatedPage.locator('.oxd-toast-content');
      await expect(toast).toBeVisible({ timeout: 30_000 });
    } finally {
      await cleanupCandidate(authenticatedPage, lastName);
    }
  });
});
