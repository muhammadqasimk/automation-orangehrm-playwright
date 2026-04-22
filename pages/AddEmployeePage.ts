import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AddEmployeePage extends BasePage {
  // ─── Locators ─────────────────────────────────────────────────────────────
  readonly firstNameInput: Locator    = this.page.locator('input[name="firstName"]');
  readonly middleNameInput: Locator   = this.page.locator('input[name="middleName"]');
  readonly lastNameInput: Locator     = this.page.locator('input[name="lastName"]');
  readonly employeeIdInput: Locator   = this.page.locator('.oxd-input-group')
    .filter({ has: this.page.locator('.oxd-label', { hasText: 'Employee Id' }) })
    .locator('input.oxd-input');
  readonly saveButton: Locator        = this.page.getByRole('button', { name: 'Save' });
  readonly firstNameError: Locator    = this.page.locator('input[name="firstName"]')
    .locator('xpath=../..')
    .locator('.oxd-input-field-error-message');
  readonly lastNameError: Locator     = this.page.locator('input[name="lastName"]')
    .locator('xpath=../..')
    .locator('.oxd-input-field-error-message');
  readonly profilePictureInput: Locator = this.page.locator('input[type="file"]');

  constructor(page: Page) {
    super(page);
  }


  async goto(): Promise<void> {
    await this.navigate('/web/index.php/pim/addEmployee');
  }

  async fillEmployeeDetails(firstName: string, lastName: string, middleName = ''): Promise<void> {
    await this.firstNameInput.fill(firstName);
    if (middleName) await this.middleNameInput.fill(middleName);
    await this.lastNameInput.fill(lastName);
  }

  async setEmployeeId(id: string): Promise<void> {
    await this.employeeIdInput.clear();
    await this.employeeIdInput.fill(id);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async uploadProfilePicture(filePath: string): Promise<void> {
    await this.profilePictureInput.setInputFiles(filePath);
  }
}
