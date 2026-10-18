import type { TaxBand } from "../types";

export const rules202526 = {
  taxYear: "2025/26" as const,
  rulesVersion: "2025.1",
  personalAllowance: 12570,
  paTaperThreshold: 100000,
  paTaperDivisor: 2,
  blindPersonsAllowance: 3130,
  marriageAllowanceTransfer: 1260,

  /** Income tax bands are expressed in TAXABLE income (after the Personal
   * Allowance) with INCLUSIVE bounds in whole pounds: each band runs from
   * `lower` to `upper`, and the next band starts at the previous upper + 1.
   * Band width is therefore (upper − lower + 1). */
  incomeTax: {
    england: [
      { name: "basic", rate: 0.20, lower: 0, upper: 37700 },
      { name: "higher", rate: 0.40, lower: 37701, upper: 112570 },
      { name: "additional", rate: 0.45, lower: 112571, upper: Infinity },
    ] as TaxBand[],
    wales: [
      { name: "basic", rate: 0.20, lower: 0, upper: 37700 },
      { name: "higher", rate: 0.40, lower: 37701, upper: 112570 },
      { name: "additional", rate: 0.45, lower: 112571, upper: Infinity },
    ] as TaxBand[],
    "northern-ireland": [
      { name: "basic", rate: 0.20, lower: 0, upper: 37700 },
      { name: "higher", rate: 0.40, lower: 37701, upper: 112570 },
      { name: "additional", rate: 0.45, lower: 112571, upper: Infinity },
    ] as TaxBand[],
    scotland: [
      { name: "starter", rate: 0.19, lower: 0, upper: 2827 },
      { name: "basic", rate: 0.20, lower: 2828, upper: 14921 },
      { name: "intermediate", rate: 0.21, lower: 14922, upper: 31092 },
      { name: "higher", rate: 0.42, lower: 31093, upper: 62430 },
      { name: "advanced", rate: 0.45, lower: 62431, upper: 112570 },
      { name: "top", rate: 0.48, lower: 112571, upper: Infinity },
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
    plan1: { threshold: 26065, rate: 0.09 },
    plan2: { threshold: 28470, rate: 0.09 },
    plan4: { threshold: 32745, rate: 0.09 },
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

  /** Payroll (per pay period) thresholds. NI and pension per-period values
   * are unchanged from 2026/27 (frozen thresholds). Student loan
   * monthly/weekly figures equal floor(annual ÷ periods), consistent with
   * the published 2026/27 values. */
  payPeriods: {
    monthly: {
      ni: { primaryThreshold: 1048, upperEarningsLimit: 4189 },
      employerNi: { secondaryThreshold: 417 },
      pension: { qualifyingEarningsLower: 520, qualifyingEarningsUpper: 4189 },
      studentLoans: {
        plan1: 2172,
        plan2: 2372,
        plan4: 2728,
        plan5: 2083,
        postgraduate: 1750,
      },
    },
    weekly: {
      ni: { primaryThreshold: 242, upperEarningsLimit: 967 },
      employerNi: { secondaryThreshold: 96 },
      pension: { qualifyingEarningsLower: 120, qualifyingEarningsUpper: 967 },
      studentLoans: {
        plan1: 501,
        plan2: 547,
        plan4: 629,
        plan5: 480,
        postgraduate: 403,
      },
    },
  },
} as const;
