// ─── Leave test data ──────────────────────────────────────────────────────────

export const LeaveData = {
  leaveTypes: {
    annual: 'Annual Leave',
    casual: 'Casual Leave',
    medical: 'Sick Leave',
  },

  // TC-LVE-005: valid future date range
  validRequest: {
    fromDate: '2026-05-05',
    toDate: '2026-05-06',
    comment: 'Planned holiday',
  },

  // TC-LVE-004: end date before start date (toDate < fromDate = invalid range)
  invalidDateRange: {
    fromDate: '2026-05-15',
    toDate: '2026-05-10',
  },

  // TC-LVE-006: past dates
  pastDates: {
    fromDate: '2026-01-01',
    toDate: '2026-01-02',
  },

  // overlapping with already-approved leave
  overlappingDates: {
    firstFrom: '2026-06-01',
    firstTo: '2026-06-03',
    overlapFrom: '2026-06-02',
    overlapTo: '2026-06-04',
  },

  // half-day
  halfDay: {
    date: '2026-05-20',
  },

  // TC-LVE-006: leave with comment
  withComment: {
    fromDate: '2026-05-22',
    toDate: '2026-05-22',
    comment: 'Doctor appointment — follow-up checkup',
  },
} as const;
