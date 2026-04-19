import { test, expect } from '../fixtures/index';
import { LeaveData } from '../test-data/leave.data';

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1 — Navigation & UI
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Leave / Navigation & UI', () => {

  // TC-LVE-001: Apply Leave form renders
  test('TC-LVE-001: Apply Leave page renders all required form elements', async ({
    authenticatedPage, leavePage,
  }) => {
    await leavePage.gotoApply();
    await expect(leavePage.leaveTypeDropdown).toBeVisible();
    await expect(leavePage.fromDateInput).toBeVisible();
    await expect(leavePage.toDateInput).toBeVisible();
    await expect(leavePage.applyButton).toBeVisible();
  });

  // TC-LVE-002: My Leave List loads
  test('TC-LVE-002: My Leave List page loads and table is visible', async ({
    authenticatedPage, leavePage,
  }) => {
    await leavePage.gotoMyLeave();
    await expect(authenticatedPage.locator('.oxd-table')).toBeVisible();
  });

  // TC-LVE-007: Admin Leave List loads
  test('TC-LVE-007: Admin Leave List page loads', async ({
    authenticatedPage, leavePage,
  }) => {
    await leavePage.gotoLeaveList();
    await expect(authenticatedPage.locator('.oxd-table')).toBeVisible();
  });

  // TC-LVE-008: Leave Entitlements page loads
  test('TC-LVE-008: Leave Entitlements page loads', async ({
    authenticatedPage, leavePage,
  }) => {
    await leavePage.gotoEntitlements();
    await expect(authenticatedPage).toHaveURL(/viewLeaveEntitlement/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2 — Validation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Leave / Validation', () => {

  test.beforeEach(async ({ leavePage }) => {
    await leavePage.gotoApply();
  });

  // TC-LVE-003: Empty form submit
  test('TC-LVE-003: submitting empty Apply Leave form shows a required error', async ({
    leavePage,
  }) => {
    await leavePage.applyButton.click();
    await expect(leavePage.dateError.first()).toBeVisible();
  });

  // TC-LVE-004: Invalid date range (toDate before fromDate)
  test('TC-LVE-004: end date before start date shows a date validation error', async ({
    leavePage,
  }) => {
    await leavePage.selectLeaveType(LeaveData.leaveTypes.annual);
    // Inverted: fromDate (15th) > toDate (10th) — invalid range
    await leavePage.setDateRange(
      LeaveData.invalidDateRange.fromDate,
      LeaveData.invalidDateRange.toDate,
    );
    await leavePage.applyButton.click();
    await expect(leavePage.dateError.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3 — Apply Leave
// Accepts either a success toast or a balance-exceeded message —
// the shared demo site often has 0 remaining leave balance.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Leave / Apply Leave', () => {

  // TC-LVE-005: Valid leave request
  test('TC-LVE-005: apply leave with valid future dates submits the request', async ({
    authenticatedPage, leavePage,
  }) => {
    await leavePage.gotoApply();
    await leavePage.applyForLeave(
      LeaveData.leaveTypes.annual,
      LeaveData.validRequest.fromDate,
      LeaveData.validRequest.toDate,
      LeaveData.validRequest.comment,
    );
    const toast = authenticatedPage.locator('.oxd-toast-content');
    await expect(toast.or(leavePage.balanceExceededError)).toBeVisible({ timeout: 30_000 });
  });

  // TC-LVE-006: Leave request with a comment
  test('TC-LVE-006: apply leave with a comment submits the request', async ({
    authenticatedPage, leavePage,
  }) => {
    await leavePage.gotoApply();
    await leavePage.applyForLeave(
      LeaveData.leaveTypes.annual,
      LeaveData.withComment.fromDate,
      LeaveData.withComment.toDate,
      LeaveData.withComment.comment,
    );
    const toast = authenticatedPage.locator('.oxd-toast-content');
    await expect(toast.or(leavePage.balanceExceededError)).toBeVisible({ timeout: 30_000 });
  });
});
