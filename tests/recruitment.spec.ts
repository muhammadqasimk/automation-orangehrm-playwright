import { test, expect } from '../fixtures/index';
import { RecruitmentData } from '../test-data/recruitment.data';
import { RecruitmentPage } from '../pages/RecruitmentPage';
import type { Page } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// unique last name and email generators to avoid collisions on the shared demo site
function uniqueLastName(): string {
  return `C${Date.now().toString().slice(-5)}`;
}

function uniqueEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

// deletes a test candidate by last name — must be called with an authenticated page
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

test.describe('Recruitment / Vacancies UI', () => {

  test('TC-REC-001: Vacancies list page loads and table is visible', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    await recruitmentPage.gotoVacancies();
    await expect(authenticatedPage.locator('.oxd-table')).toBeVisible();
  });

  test('TC-REC-002: Add Vacancy button navigates to the Add Vacancy form', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    await recruitmentPage.gotoVacancies();
    await recruitmentPage.clickAdd();
    await expect(authenticatedPage).toHaveURL(/addJobVacancy/);
    await expect(recruitmentPage.vacancyNameInput).toBeVisible();
  });
});

test.describe('Recruitment / Candidates UI & Validation', () => {

  test('TC-REC-003: Candidates list page loads and table is visible', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    await recruitmentPage.gotoCandidates();
    await expect(authenticatedPage.locator('.oxd-table')).toBeVisible();
  });

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

  test('TC-REC-006: searching candidates with a non-existent name shows "No Records Found"', async ({
    recruitmentPage,
  }) => {
    await recruitmentPage.gotoCandidates();
    await recruitmentPage.searchCandidateByName('ZZZNOMATCH99999XYZ');
    await expect(recruitmentPage.noRecordsMessage).toBeVisible();
  });
});

test.describe('Recruitment / Add Candidate', () => {

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

  test('TC-REC-009: XSS payload in candidate first name is stored without sanitisation — BUG-018', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    const lastName = uniqueLastName();
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.selectFirstAvailableVacancy();
    await recruitmentPage.fillCandidateDetails(
      RecruitmentData.xssCandidate.firstName,
      lastName,
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

  test('TC-REC-010: numeric-only candidate first name is accepted without validation error — BUG-020', async ({
    authenticatedPage, recruitmentPage,
  }) => {
    const lastName = uniqueLastName();
    await recruitmentPage.gotoAddCandidate();
    await recruitmentPage.selectFirstAvailableVacancy();
    await recruitmentPage.fillCandidateDetails(
      RecruitmentData.numericCandidate.firstName,
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
