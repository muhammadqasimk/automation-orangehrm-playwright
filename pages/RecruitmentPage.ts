import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RecruitmentPage extends BasePage {
  // ─── Vacancy form locators ────────────────────────────────────────────────
  readonly jobTitleDropdown: Locator      = this.page.locator('.oxd-select-text').first();
  readonly vacancyNameInput: Locator      = this.page.locator('input.oxd-input').nth(1);
  readonly positionsInput: Locator        = this.page.locator('input.oxd-input').nth(2);
  readonly addButton: Locator             = this.page.getByRole('button', { name: 'Add' });
  readonly saveButton: Locator            = this.page.getByRole('button', { name: 'Save' });
  readonly searchButton: Locator          = this.page.getByRole('button', { name: 'Search' });

  // ─── Candidate form locators ──────────────────────────────────────────────
  readonly candidateFirstName: Locator    = this.page.locator('input[name="firstName"]');
  readonly candidateLastName: Locator     = this.page.locator('input[name="lastName"]');
  readonly candidateEmail: Locator        = this.page.locator('input[placeholder="Type here"]').first();
  readonly candidateContactNo: Locator    = this.page.locator('input[placeholder="Type here"]').nth(1);
  readonly cvUploadInput: Locator         = this.page.locator('input[type="file"]');
  readonly vacancyDropdown: Locator       = this.page.locator('.oxd-select-text').nth(1);

  // ─── List / table locators ────────────────────────────────────────────────
  readonly tableRows: Locator             = this.page.locator('.oxd-table-body .oxd-table-row');
  readonly noRecordsMessage: Locator      = this.page.getByText('No Records Found');

  // ─── Validation errors ────────────────────────────────────────────────────
  readonly firstNameError: Locator        = this.page.locator(
    '.oxd-grid-item:has([name="firstName"]) .oxd-input-field-error-message'
  );
  readonly lastNameError: Locator         = this.page.locator(
    '.oxd-grid-item:has([name="lastName"]) .oxd-input-field-error-message'
  );
  readonly emailError: Locator            = this.page.locator(
    '.oxd-input-field-error-message'
  ).first();

  // ─── Candidate list / search ──────────────────────────────────────────────
  readonly candidateSearchInput: Locator  = this.page.locator('.oxd-table-filter input').first();

  constructor(page: Page) {
    super(page);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async gotoVacancies(): Promise<void> {
    await this.navigate('/web/index.php/recruitment/viewJobVacancy');
  }

  async gotoCandidates(): Promise<void> {
    await this.navigate('/web/index.php/recruitment/viewCandidates');
  }

  async gotoAddCandidate(): Promise<void> {
    await this.navigate('/web/index.php/recruitment/addCandidate');
  }

  async clickAdd(): Promise<void> {
    await this.addButton.click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async fillCandidateDetails(firstName: string, lastName: string, email: string, contactNo = ''): Promise<void> {
    await this.candidateFirstName.fill(firstName);
    await this.candidateLastName.fill(lastName);
    await this.candidateEmail.fill(email);
    if (contactNo) await this.candidateContactNo.fill(contactNo);
  }

  async selectFirstAvailableVacancy(): Promise<void> {
    await this.vacancyDropdown.click();
    await this.page.locator('[role="option"]').first().click();
  }

  async searchCandidateByName(name: string): Promise<void> {
    await this.candidateSearchInput.fill(name);
    await this.searchButton.click();
    await this.waitForPageLoad();
  }

  async clickDeleteForCandidate(rowIndex: number): Promise<void> {
    await this.tableRows.nth(rowIndex).getByRole('button').last().click();
  }

  async confirmDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }

  async uploadCV(filePath: string): Promise<void> {
    await this.cvUploadInput.setInputFiles(filePath);
  }
}
