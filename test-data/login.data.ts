// ─── Login test data ──────────────────────────────────────────────────────────

export const LoginData = {
  validAdmin: {
    username: process.env.ADMIN_USERNAME ?? 'Admin',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  },

  invalidCredentials: {
    username: 'invalidUser123',
    password: 'WrongPass999',
  },

  emptyFields: {
    username: '',
    password: '',
  },

  // TC-LOG-011: SQL injection
  sqlInjection: {
    username: `' OR '1'='1' --`,
    password: 'any',
  },

  // TC-LOG-012: XSS in username
  xssPayload: {
    username: '<script>alert("XSS")</script>',
    password: 'any',
  },

  // TC-LOG-013: Excessive character input — 256 chars
  excessiveInput: {
    username: 'A'.repeat(256),
    password: 'A'.repeat(256),
  },

  // TC-LOG-014: Leading/trailing whitespace
  usernameWithSpaces: {
    username: ' Admin ',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  },

  // TC-LOG-021: Weak password — no minimum length
  weakPassword: {
    username: 'testuser',
    password: '1',
  },

  // TC-LOG-025: Case sensitivity — lowercase
  lowercaseUsername: {
    username: 'admin',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
  },

  resetPassword: {
    registeredEmail: 'admin@example.com',
    unregisteredEmail: 'ghost@notregistered.com',
  },
} as const;
