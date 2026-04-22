import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeavePage extends BasePage {
  readonly leaveTypeDropdown: Locator  = this.page.locator('.oxd-select-text').first();
  readonly fromDateInput: Locator      = this.page.locator('input[placeholder="yyyy-dd-mm"]').first();
  readonly toDateInput: Locator        = this.page.locator('input[placeholder="yyyy-dd-mm"]').last();
  readonly commentInput: Locator       = this.page.locator('textarea.oxd-textarea');
  readonly applyButton: Locator        = this.page.getByRole('button', { name: 'Apply' });

  readonly tableRows: Locator          = this.page.locator('.oxd-table-body .oxd-table-row');
  readonly noRecordsMessage: Locator   = this.page.getByText('No Records Found');
  readonly dateError: Locator          = this.page.locator('.oxd-input-field-error-message');
  readonly balanceExceededError: Locator = this.page.getByText('Failed to Submit: Leave Balance Exceeded');

  constructor(page: Page) {
    super(page);
  }


  async gotoApply(): Promise<void> {
    await this.navigate('/web/index.php/leave/applyLeave');
  }

  async gotoMyLeave(): Promise<void> {
    await this.navigate('/web/index.php/leave/viewMyLeaveList');
  }

  async gotoLeaveList(): Promise<void> {
    await this.navigate('/web/index.php/leave/viewLeaveList');
  }

  async gotoEntitlements(): Promise<void> {
    await this.navigate('/web/index.php/leave/viewLeaveEntitlement');
  }

  async selectLeaveType(leaveType: string): Promise<void> {
    await this.leaveTypeDropdown.click();
    await this.page.getByRole('option', { name: leaveType }).click();
  }

  async setDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.fromDateInput.fill(fromDate);
    await this.fromDateInput.press('Enter');
    await this.toDateInput.fill(toDate);
    await this.toDateInput.press('Enter');
  }

  async addComment(comment: string): Promise<void> {
    await this.commentInput.fill(comment);
  }

  async applyForLeave(leaveType: string, fromDate: string, toDate: string, comment = ''): Promise<void> {
    await this.selectLeaveType(leaveType);
    await this.setDateRange(fromDate, toDate);
    if (comment) await this.addComment(comment);
    await this.applyButton.click();
  }
}
