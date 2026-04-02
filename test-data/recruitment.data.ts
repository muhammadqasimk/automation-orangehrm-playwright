// ─── Recruitment test data ────────────────────────────────────────────────────

export const RecruitmentData = {
  vacancy: {
    jobTitle: 'Software Engineer',
    name: 'SE - Backend 2026',
    positions: '2',
    positionsUpdated: '5',
  },

  // TC-REC-007: valid candidate
  validCandidate: {
    firstName: 'Alice',
    lastName: 'Nguyen',
    email: `alice.nguyen+${Date.now()}@gmail.com`, // unique email per run
    contactNo: '+1 555-999-1234',
  },

  // TC-REC-009: XSS in candidate name — BUG-018
  xssCandidate: {
    firstName: '<script>alert("XSS")</script>',
    lastName: '<img src=x onerror=alert(1)>',
    email: 'xss.test@example.com',
  },

  // TC-REC-010: numeric-only name — BUG-020
  numericCandidate: {
    firstName: '99999',
    lastName: '12345',
    email: 'numeric.name@example.com',
  },

  // TC-REC-011: single-digit contact number — BUG-019
  shortContactNo: {
    firstName: 'Test',
    lastName: 'ShortNo',
    email: 'short.contact@example.com',
    contactNo: '1',
  },

  // TC-REC-012: invalid email formats
  invalidEmail: 'notanemail',
} as const;
