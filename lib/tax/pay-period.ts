import { clamp, positive, roundPence, toPence } from "./money";
import { getBands, getRules, type RuleSet } from "./rules";
import { parseTaxCode } from "./income-tax";
import { normalizeInput } from "./calculate";
import type {
  CalculationInput,
  PensionBasis,
  StudentLoanPlan,
  TaxBand,
} from "./types";

export type PayrollFrequency = "monthly" | "weekly";
export type TaxBasis = "cumulative" | "month1";

export interface PayrollPeriodOptions {
  frequency: PayrollFrequency;
  periodNumber: number;
  taxBasis?: TaxBasis;
}

export interface PeriodAmounts {
  gross: number; // pence
  salarySacrifice: number;
  incomeTax: number;
  employeeNi: number;
  employerNi: number;
  pensionEmployee: number;
  pensionEmployer: number;
  studentLoan: number;
  net: number;
}

export interface PayrollPeriodResult {
  frequency: PayrollFrequency;
  periodNumber: number;
  taxBasis: TaxBasis;
  periodsPerYear: number;
  thisPeriod: PeriodAmounts;
  yearToDate: PeriodAmounts;
}

export const PERIODS_PER_YEAR: Record<PayrollFrequency, number> = {
  monthly: 12,
  weekly: 52,
};

export function periodsPerYear(frequency: PayrollFrequency): number {
  return PERIODS_PER_YEAR[frequency];
}

export function isValidPeriodNumber(
  frequency: PayrollFrequency,
  periodNumber: number
): boolean {
  return (
    Number.isInteger(periodNumber) &&
    periodNumber >= 1 &&
    periodNumber <= PERIODS_PER_YEAR[frequency]
  );
}

/** Scale an annual pounds amount into a fraction of the year, in pence. */
function scalePence(annualPounds: number, scale: number): number {
  return roundPence(toPence(annualPounds) * scale);
}

/** Banded tax over bands expressed in annual pounds, scaled to a fraction
 * of the year (e.g. 6/12 for month 6 cumulative). */
function bandedTaxScaled(
  taxablePence: number,
  bands: TaxBand[],
  scale: number
): number {
  let remaining = taxablePence;
  let total = 0;

  for (const band of bands) {
    if (remaining <= 0) break;
    // Bounds are inclusive: width is (upper − lower + 1), scaled to the
    // fraction of the year being calculated.
    const width =
      band.upper === Infinity
        ? remaining
        : scalePence(band.upper - band.lower + 1, scale);
    const amountInBand = clamp(remaining, 0, width);
    total += roundPence(amountInBand * band.rate);
    remaining -= amountInBand;
  }

  return total;
}

/** Personal allowance (with taper and extra allowances) for a fraction of
 * the year, in pence. */
function scaledAllowance(
  input: CalculationInput,
  rules: RuleSet,
  scale: number,
  adjustedNetPence: number
): number {
  const base = parseTaxCode(input.taxCode, rules.personalAllowance);
  if (base === Infinity) return Infinity;

  let allowance = scalePence(base, scale);

  // Taper: £1 of allowance lost per £2 of adjusted net income over the
  // threshold (the divisor itself is not scaled).
  const threshold = scalePence(rules.paTaperThreshold, scale);
  if (adjustedNetPence > threshold) {
    allowance = Math.max(
      0,
      allowance - Math.floor((adjustedNetPence - threshold) / rules.paTaperDivisor)
    );
  }

  if (input.blindPersonsAllowance) {
    allowance += scalePence(rules.blindPersonsAllowance, scale);
  }
  if (input.marriageAllowanceReceive) {
    allowance += scalePence(rules.marriageAllowanceTransfer, scale);
  }
  if (input.marriageAllowanceTransfer) {
    allowance -= scalePence(rules.marriageAllowanceTransfer, scale);
  }

  return Math.max(0, allowance);
}

/** Income tax due on a cumulative taxable amount, using the allowance and
 * bands pro-rated to that point in the tax year. */
function taxForFraction(
  input: CalculationInput,
  rules: RuleSet,
  scale: number,
  taxablePence: number,
  adjustedNetPence: number
): number {
  const allowance = scaledAllowance(input, rules, scale, adjustedNetPence);
  if (allowance === Infinity) return 0;
  const taxable = positive(taxablePence - Math.min(allowance, taxablePence));
  return bandedTaxScaled(
    taxable,
    getBands(input.taxYear, input.region),
    scale
  );
}

/** Employee NI for one pay period. */
function periodEmployeeNi(
  payPence: number,
  primaryThreshold: number,
  upperEarningsLimit: number,
  mainRate: number,
  upperRate: number
): number {
  const pt = toPence(primaryThreshold);
  const uel = toPence(upperEarningsLimit);
  const abovePt = positive(payPence - pt);
  const mainAmount = clamp(abovePt, 0, uel - pt);
  const upperAmount = positive(payPence - uel);
  return (
    roundPence(mainAmount * mainRate) + roundPence(upperAmount * upperRate)
  );
}

/** Pension contribution for one pay period. */
function periodPension(
  payPence: number,
  percent: number,
  basis: PensionBasis,
  qeLowerPounds: number,
  qeUpperPounds: number
): number {
  if (basis === "qualifying-earnings") {
    const lower = toPence(qeLowerPounds);
    const qe = clamp(payPence - lower, 0, toPence(qeUpperPounds) - lower);
    return roundPence(qe * (percent / 100));
  }
  return roundPence(payPence * (percent / 100));
}

/** Student loan repayment for one pay period, floored to whole pounds
 * (HMRC rounds each period's deduction down to the nearest pound). */
function periodStudentLoan(
  payPence: number,
  thresholdPounds: number,
  rate: number
): number {
  const excess = positive(payPence - toPence(thresholdPounds));
  if (excess === 0) return 0;
  return Math.floor(roundPence(excess * rate) / 100) * 100;
}

/**
 * Payroll-accurate calculation for one pay period (month or week).
 *
 * Unlike the annual engine, this uses HMRC's per-period NI, employer NI,
 * pension and student loan thresholds, and computes PAYE cumulatively
 * across the tax year by default (or on a Month 1 / Week 1 basis).
 */
export function calculatePayrollPeriod(
  input: Partial<CalculationInput>,
  options: PayrollPeriodOptions
): PayrollPeriodResult {
  const normalized = normalizeInput(input);
  const { frequency, periodNumber } = options;
  const taxBasis: TaxBasis = options.taxBasis ?? "cumulative";

  if (!isValidPeriodNumber(frequency, periodNumber)) {
    throw new Error(
      `Invalid period number ${periodNumber} for ${frequency} pay ` +
        `(expected 1–${periodsPerYear(frequency)})`
    );
  }

  const periods = periodsPerYear(frequency);
  const rules = getRules(normalized.taxYear);
  const periodRules = rules.payPeriods[frequency];
  const pension = normalized.pension ?? {
    method: "none" as const,
    employeePercent: 0,
    employerPercent: 0,
    basis: "qualifying-earnings" as const,
  };

  // ---- Gross pay for the period & salary sacrifice ----
  const annualGrossPence = toPence(normalized.grossAnnualSalary);
  const grossPence = roundPence(annualGrossPence / periods);

  let salarySacrifice = 0;
  let payAfterSacrifice = grossPence;
  if (pension.method === "salary-sacrifice" && pension.employeePercent > 0) {
    salarySacrifice = roundPence(grossPence * (pension.employeePercent / 100));
    payAfterSacrifice = positive(grossPence - salarySacrifice);
  }

  // ---- Pension ----
  let pensionEmployee = 0;
  let pensionEmployer = 0;
  if (pension.method !== "none") {
    pensionEmployer = periodPension(
      payAfterSacrifice,
      pension.employerPercent,
      pension.basis,
      periodRules.pension.qualifyingEarningsLower,
      periodRules.pension.qualifyingEarningsUpper
    );
    if (pension.method !== "salary-sacrifice") {
      pensionEmployee = periodPension(
        payAfterSacrifice,
        pension.employeePercent,
        pension.basis,
        periodRules.pension.qualifyingEarningsLower,
        periodRules.pension.qualifyingEarningsUpper
      );
    }
  }

  // ---- Taxable pay for the period ----
  //   net-pay: employee pension is deducted before income tax
  //   salary-sacrifice: sacrifice already removed from gross
  //   relief-at-source / none: no reduction before tax
  let taxablePence = payAfterSacrifice;
  if (pension.method === "net-pay") {
    taxablePence = positive(payAfterSacrifice - pensionEmployee);
  }

  // Adjusted net income for the Personal Allowance taper (relief-at-source
  // contributions are grossed up).
  const adjustedPence =
    pension.method === "relief-at-source"
      ? taxablePence + roundPence(pensionEmployee / 0.8)
      : taxablePence;

  // ---- Income tax ----
  let incomeTaxThisPeriod: number;
  let incomeTaxYtd: number;

  if (taxBasis === "month1") {
    incomeTaxThisPeriod = taxForFraction(
      normalized,
      rules,
      1 / periods,
      taxablePence,
      adjustedPence
    );
    incomeTaxYtd = incomeTaxThisPeriod * periodNumber;
  } else {
    const dueYtd = taxForFraction(
      normalized,
      rules,
      periodNumber / periods,
      taxablePence * periodNumber,
      adjustedPence * periodNumber
    );
    const duePrior = taxForFraction(
      normalized,
      rules,
      (periodNumber - 1) / periods,
      taxablePence * (periodNumber - 1),
      adjustedPence * (periodNumber - 1)
    );
    incomeTaxThisPeriod = Math.max(0, dueYtd - duePrior);
    incomeTaxYtd = dueYtd;
  }


  // ---- Employee NI ----
  const employeeNiThisPeriod = periodEmployeeNi(
    payAfterSacrifice,
    periodRules.ni.primaryThreshold,
    periodRules.ni.upperEarningsLimit,
    rules.nationalInsurance.mainRate,
    rules.nationalInsurance.upperRate
  );

  // ---- Employer NI (Employment Allowance is an annual cap) ----
  const rawEmployerNi = roundPence(
    positive(
      payAfterSacrifice - toPence(periodRules.employerNi.secondaryThreshold)
    ) * rules.employerNationalInsurance.rate
  );
  let employerNiThisPeriod = rawEmployerNi;
  let employerNiYtd = rawEmployerNi * periodNumber;

  if (normalized.employmentAllowance) {
    const allowance = toPence(rules.employmentAllowance);
    const netYtd = Math.max(0, employerNiYtd - allowance);
    const netPrior = Math.max(
      0,
      rawEmployerNi * (periodNumber - 1) - allowance
    );
    employerNiThisPeriod = netYtd - netPrior;
    employerNiYtd = netYtd;
  }

  // ---- Student loans (each period's deduction is floored to whole pounds) ----
  let studentLoanThisPeriod = 0;
  for (const plan of normalized.studentLoans) {
    const threshold = periodRules.studentLoans[plan as StudentLoanPlan];
    const rate = rules.studentLoans[plan as StudentLoanPlan]?.rate;
    if (threshold === undefined || rate === undefined) continue;
    studentLoanThisPeriod += periodStudentLoan(
      payAfterSacrifice,
      threshold,
      rate
    );
  }

  // ---- Net pay ----
  const netThisPeriod = positive(
    payAfterSacrifice -
      incomeTaxThisPeriod -
      employeeNiThisPeriod -
      pensionEmployee -
      studentLoanThisPeriod
  );

  const employeeNiYtd = employeeNiThisPeriod * periodNumber;
  const pensionEmployeeYtd = pensionEmployee * periodNumber;
  const studentLoanYtd = studentLoanThisPeriod * periodNumber;
  const netYtd = positive(
    payAfterSacrifice * periodNumber -
      incomeTaxYtd -
      employeeNiYtd -
      pensionEmployeeYtd -
      studentLoanYtd
  );

  return {
    frequency,
    periodNumber,
    taxBasis,
    periodsPerYear: periods,
    thisPeriod: {
      gross: grossPence,
      salarySacrifice,
      incomeTax: incomeTaxThisPeriod,
      employeeNi: employeeNiThisPeriod,
      employerNi: employerNiThisPeriod,
      pensionEmployee,
      pensionEmployer,
      studentLoan: studentLoanThisPeriod,
      net: netThisPeriod,
    },
    yearToDate: {
      gross: grossPence * periodNumber,
      salarySacrifice: salarySacrifice * periodNumber,
      incomeTax: incomeTaxYtd,
      employeeNi: employeeNiYtd,
      employerNi: employerNiYtd,
      pensionEmployee: pensionEmployeeYtd,
      pensionEmployer: pensionEmployer * periodNumber,
      studentLoan: studentLoanYtd,
      net: netYtd,
    },
  };
}

