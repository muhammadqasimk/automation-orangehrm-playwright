# OrangeHRM Playwright Automation

[![CI](https://github.com/muhammadqasimk/automation-orangehrm-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/muhammadqasimk/automation-orangehrm-playwright/actions/workflows/playwright.yml)

End-to-end test automation suite for [OrangeHRM](https://opensource-demo.orangehrmlive.com) built with **Playwright** and **TypeScript**. Covers functional, validation, security, and API-level assertions across four modules with dual HTML + Allure reporting and cross-browser CI.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [Playwright](https://playwright.dev) | Browser automation & test runner |
| TypeScript | Type-safe test authoring |
| Allure | Rich test reporting |
| GitHub Actions | CI/CD pipeline |
| Page Object Model | Maintainable locator & action abstraction |

---

## Test Coverage

| Module | Spec file | Tests | Groups |
|---|---|---|---|
| Login / Auth | `tests/login.spec.ts` | 20 | Functional · Security · Mobile · Performance |
| Employee Management | `tests/employee.spec.ts` | 22 | Add · Search · Edit · Delete · API · Validation |
| Leave Management | `tests/leave.spec.ts` | 6 | Navigation · Validation · Apply Leave |
| Recruitment | `tests/recruitment.spec.ts` | 10 | Vacancies · Candidates · Add Candidate |
| **Total** | | **~58 tests** | |

### Highlighted coverage

- **Happy-path flows** — login, add/edit/delete employee, apply leave, add candidate
- **Negative testing** — empty forms, invalid inputs, inverted date ranges
- **Security** — SQL injection, stored XSS (OWASP A03:2021), HTTPS enforcement, session management, no credential exposure in URLs, no user enumeration
- **API assertions** — HTTP status code verification on create/delete endpoints
- **Bug documentation** — 10+ known bugs captured with `test.fail()` and annotated IDs (BUG-001 → BUG-020)

---

## Project Structure

```
├── tests/
│   ├── login.spec.ts          # Authentication & security
│   ├── employee.spec.ts       # Employee CRUD & validation
│   ├── leave.spec.ts          # Leave application & list
│   └── recruitment.spec.ts    # Vacancies & candidate management
├── pages/
│   ├── BasePage.ts            # Shared navigation & utilities
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── AddEmployeePage.ts
│   ├── EmployeeListPage.ts
│   ├── LeavePage.ts
│   └── RecruitmentPage.ts
├── fixtures/
│   └── index.ts               # Custom Playwright fixtures (POM + authenticatedPage)
├── test-data/
│   ├── login.data.ts
│   ├── employee.data.ts
│   ├── leave.data.ts
│   └── recruitment.data.ts
├── utils/
│   └── api-helper.ts          # Request/response interceptor
├── playwright.config.ts       # Projects: Chromium · Firefox · WebKit · Mobile
└── .github/workflows/
    └── playwright.yml         # CI: matrix across Chromium & Firefox
```

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/automation-orangehrm-playwright.git
cd automation-orangehrm-playwright

# 2. Install dependencies
npm ci

# 3. Install Playwright browsers
npx playwright install --with-deps
```

No `.env` file is required — the default base URL points to the public OrangeHRM demo site. To override:

```bash
# .env (optional)
BASE_URL=https://opensource-demo.orangehrmlive.com
```

---

## Running Tests

```bash
# All tests, all browsers
npx playwright test

# Single browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Single spec
npx playwright test tests/login.spec.ts

# Headed mode (watch the browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

---

## Reports

### Playwright HTML Report
```bash
npx playwright show-report
```

### Allure Report
```bash
# Generate and open
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

In CI, the Allure report is automatically published to **GitHub Pages** on every push to `main`.

---

## CI/CD

GitHub Actions runs the full suite against **Chromium** and **Firefox** in parallel on every push and pull request.

```
Push / PR → ubuntu-latest
  ├── E2E – chromium
  └── E2E – firefox
        └── allure-report → GitHub Pages (main branch only)
```

Artifacts (HTML report + Allure results) are retained for 14 days per run.

---

## Known Bugs Found

| ID | Module | Severity | Description |
|---|---|---|---|
| BUG-001 | Login | Low | No max-length validation on username/password inputs |
| BUG-002 | Login | Medium | No minimum password length enforced at login |
| BUG-004 | Login | Critical | No account lockout after repeated failed attempts |
| BUG-005 | Login | Low | Failed login returns HTTP 302 instead of 401 |
| BUG-006 | Login | Medium | Leading/trailing spaces in username cause login failure |
| BUG-007 | Login | Low | Username is case-sensitive ("Admin" ≠ "admin") |
| BUG-010 | Employee | Medium | Numeric-only first names are accepted |
| BUG-011 | Employee | High | Stored XSS — script payloads saved without sanitisation |
| BUG-012 | Employee | Low | First name field clears after 30-char validation error |
| BUG-015 | Employee | Low | Add employee API returns 200 instead of 201 |
| BUG-017 | Employee | Low | Delete employee API returns 200 instead of 204 |
| BUG-018 | Recruitment | High | Stored XSS in candidate first name |
| BUG-019 | Recruitment | Medium | Single-digit contact number passes validation |
| BUG-020 | Recruitment | Medium | Numeric-only candidate name accepted |
