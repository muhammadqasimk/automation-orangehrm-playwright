// ─── Employee test data ───────────────────────────────────────────────────────

export const EmployeeData = {
  valid: {
    firstName: 'John',
    middleName: 'William',
    lastName: 'Doe',
  },

  // TC-EMP-005 / TC-EMP-023: validation failure cases
  numericFirstName: {
    firstName: '12345',
    lastName: 'ValidLast',
  },

  // TC-EMP-023: XSS in First Name — BUG-011
  xssFirstName: {
    firstName: '<script>alert(1)</script>',
    lastName: 'TestLast',
  },

  // TC-EMP-025: SQL injection in name fields
  sqlInjectionFirstName: {
    firstName: `' OR '1'='1`,
    lastName: 'TestLast',
  },

  // TC-EMP-024: 31 chars — exceeds 30-char limit
  overMaxLengthName: {
    firstName: 'A'.repeat(31),
    lastName: 'ValidLast',
  },

  employeeIdSpecialChars: 'EMP@#$%',

  // TC-EMP-003: duplicate ID — use one that already exists
  duplicateEmployeeId: '0001',

  search: {
    byFirstName: 'John',
    byLastName: 'Doe',
    noMatch: 'ZZZNoSuchEmployee',
    employeeId: '0001',
  },

  contactDetails: {
    workEmail: 'john.doe@company.com',
    mobileNumber: '+1 555-123-4567',
  },
} as const;
