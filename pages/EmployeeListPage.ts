import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class EmployeeListPage extends BasePage {
  // ─── Locators ─────────────────────────────────────────────────────────────
  readonly pageHeading: Locator         = this.page.getByRole('heading', { name: 'Employee Information' });
  readonly employeeNameFilter: Locator  = this.page.locator('.oxd-table-filter input').first();
  readonly employeeIdFilter: Locator    = this.page.locator('.oxd-table-filter input').nth(1);
  readonly searchButton: Locator        = this.page.getByRole('button', { name: 'Search' });
  readonly resetButton: Locator         = this.page.getByRole('button', { name: 'Reset' });
  readonly addEmployeeButton: Locator   = this.page.getByRole('button', { name: 'Add' });
  readonly tableRows: Locator           = this.page.locator('.oxd-table-body .oxd-table-row');
  readonly noRecordsMessage: Locator    = this.page.getByText('No Records Found').first();
  readonly recordCount: Locator         = this.page.getByText(/\(\d+\) Records Found/);

  constructor(page: Page) {
    super(page);
  }


  async goto(): Promise<void> {
    await this.navigate('/web/index.php/pim/viewEmployeeList');
  }

  async searchByName(name: string): Promise<void> {
    await this.employeeNameFilter.fill(name);
    await this.searchButton.click();
    await this.waitForPageLoad();
  }

  async searchByEmployeeId(id: string): Promise<void> {
    await this.employeeIdFilter.fill(id);
    await this.searchButton.click();
    await this.waitForPageLoad();
  }

  async clickAddEmployee(): Promise<void> {
    await this.addEmployeeButton.click();
  }

  async clickDeleteForEmployee(rowIndex: number): Promise<void> {
    const deleteButton = this.tableRows.nth(rowIndex).getByRole('button').filter({ hasText: '' }).last();
    await deleteButton.click();
  }

  async confirmDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }

  async cancelDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'No, Cancel' }).click();
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }
}
