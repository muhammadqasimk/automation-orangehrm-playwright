// ─── Leave test data ──────────────────────────────────────────────────────────

export const LeaveData = {
  leaveTypes: {
    annual: 'Annual Leave',
    casual: 'Casual Leave',
    medical: 'Sick Leave',
  },

  // TC-LVE-002: valid future date range
  validRequest: {
    fromDate: '2026-04-10',
    toDate: '2026-04-11',
    comment: 'Planned holiday',
  },

  // TC-LVE-003: end date before start date
  invalidDateRange: {
    fromDate: '2026-04-15',
    toDate: '2026-04-10',
  },

  // TC-LVE-004: past dates
  pastDates: {
    fromDate: '2026-01-01',
    toDate: '2026-01-02',
  },

  // TC-LVE-005: overlapping with already-approved leave
  overlappingDates: {
    firstFrom: '2026-05-01',
    firstTo: '2026-05-03',
    overlapFrom: '2026-05-02',
    overlapTo: '2026-05-04',
  },

  // TC-LVE-007: half-day
  halfDay: {
    date: '2026-04-20',
  },

  // TC-LVE-008: leave with comment
  withComment: {
    fromDate: '2026-04-22',
    toDate: '2026-04-22',
    comment: 'Doctor appointment — follow-up checkup',
  },
} as const;
