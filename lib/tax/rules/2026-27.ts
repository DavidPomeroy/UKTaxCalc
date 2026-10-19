import type { TaxBand } from "../types";

export const rules202627 = {
  taxYear: "2026/27" as const,
  rulesVersion: "2026.1",
  personalAllowance: 12570,
  paTaperThreshold: 100000,
  paTaperDivisor: 2, // lose £1 of PA for every £2 over threshold
  blindPersonsAllowance: 3250,
  marriageAllowanceTransfer: 1260,

  /** Income tax bands are expressed in TAXABLE income (after the Personal
   * Allowance). `lower` and `upper` are the cumulative boundaries at which
   * each band starts and ends, in whole pounds, and the band is
   * (upper − lower) wide. Adjacent bands share a boundary.
   *
   * These match HMRC's "Income after allowances" table, so the top threshold
   * is £125,140 of TAXABLE income — it is NOT £125,140 gross minus the
   * Personal Allowance. By the time taxable income reaches £125,140 the
   * allowance has already tapered to nil, so the two coincide. */
  incomeTax: {
    england: [
      { name: "basic", rate: 0.20, lower: 0, upper: 37700 },
      { name: "higher", rate: 0.40, lower: 37700, upper: 125140 },
      { name: "additional", rate: 0.45, lower: 125140, upper: Infinity },
    ] as TaxBand[],
    wales: [
      { name: "basic", rate: 0.20, lower: 0, upper: 37700 },
      { name: "higher", rate: 0.40, lower: 37700, upper: 125140 },
      { name: "additional", rate: 0.45, lower: 125140, upper: Infinity },
    ] as TaxBand[],
    "northern-ireland": [
      { name: "basic", rate: 0.20, lower: 0, upper: 37700 },
      { name: "higher", rate: 0.40, lower: 37700, upper: 125140 },
      { name: "additional", rate: 0.45, lower: 125140, upper: Infinity },
    ] as TaxBand[],
    scotland: [
      { name: "starter", rate: 0.19, lower: 0, upper: 3967 },
      { name: "basic", rate: 0.20, lower: 3967, upper: 16956 },
      { name: "intermediate", rate: 0.21, lower: 16956, upper: 31092 },
      { name: "higher", rate: 0.42, lower: 31092, upper: 62430 },
      { name: "advanced", rate: 0.45, lower: 62430, upper: 125140 },
      { name: "top", rate: 0.48, lower: 125140, upper: Infinity },
    ] as TaxBand[],
  },

  nationalInsurance: {
    primaryThreshold: 12570,
    upperEarningsLimit: 50270,
    mainRate: 0.08,
    upperRate: 0.02,
  },

  employerNationalInsurance: {
    secondaryThreshold: 5000,
    rate: 0.15,
  },

  employmentAllowance: 10500,

  studentLoans: {
    plan1: { threshold: 26900, rate: 0.09 },
    plan2: { threshold: 29385, rate: 0.09 },
    plan4: { threshold: 33795, rate: 0.09 },
    plan5: { threshold: 25000, rate: 0.09 },
    postgraduate: { threshold: 21000, rate: 0.06 },
  },

  pension: {
    earningsTrigger: 10000,
    qualifyingEarningsLower: 6240,
    qualifyingEarningsUpper: 50270,
    minEmployeePercent: 5,
    minEmployerPercent: 3,
  },

  /** Payroll (per pay period) thresholds. HMRC publishes these separately
   * from the annual thresholds; they are not simply annual ÷ periods.
   * Student loan monthly/weekly figures equal floor(annual ÷ periods) and
   * were cross-checked against the published 2026/27 values. */
  payPeriods: {
    monthly: {
      ni: { primaryThreshold: 1048, upperEarningsLimit: 4189 },
      employerNi: { secondaryThreshold: 417 },
      pension: { qualifyingEarningsLower: 520, qualifyingEarningsUpper: 4189 },
      studentLoans: {
        plan1: 2241,
        plan2: 2448,
        plan4: 2816,
        plan5: 2083,
        postgraduate: 1750,
      },
    },
    weekly: {
      ni: { primaryThreshold: 242, upperEarningsLimit: 967 },
      employerNi: { secondaryThreshold: 96 },
      pension: { qualifyingEarningsLower: 120, qualifyingEarningsUpper: 967 },
      studentLoans: {
        plan1: 517,
        plan2: 565,
        plan4: 649,
        plan5: 480,
        postgraduate: 403,
      },
    },
  },
} as const;
