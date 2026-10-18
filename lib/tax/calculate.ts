import { clamp, positive, roundPence, sumPence, toPence, toPounds } from "./money";
import type {
  CalculationInput,
  CalculationResult,
  EmployerResult,
  TakeHomeResult,
  TaxYear,
  Region,
} from "./types";
import { getRules, CURRENT_TAX_YEAR } from "./rules";
import { calculateIncomeTax } from "./income-tax";
import { calculateEmployeeNI, calculateEmployerNI } from "./national-insurance";
import { calculateStudentLoan } from "./student-loan";
import { calculatePension } from "./pension";

const DEFAULT_PENSION: NonNullable<CalculationInput["pension"]> = {
  method: "none",
  employeePercent: 0,
  employerPercent: 0,
  basis: "qualifying-earnings",
};

export function normalizeInput(
  input: Partial<CalculationInput>
): CalculationInput {
  const pension = input.pension ?? DEFAULT_PENSION;
  return {
    taxYear: (input.taxYear ?? CURRENT_TAX_YEAR) as TaxYear,
    region: (input.region ?? "england") as Region,
    grossAnnualSalary: input.grossAnnualSalary ?? 0,
    payFrequency: input.payFrequency ?? "annual",
    pension: {
      method: pension.method ?? "none",
      employeePercent: pension.employeePercent ?? 0,
      employerPercent: pension.employerPercent ?? 0,
      basis: pension.basis ?? "qualifying-earnings",
    },
    studentLoans: input.studentLoans ?? [],
    taxCode: input.taxCode ?? "1257L",
    customPersonalAllowance: input.customPersonalAllowance,
    blindPersonsAllowance: input.blindPersonsAllowance ?? false,
    marriageAllowanceTransfer: input.marriageAllowanceTransfer ?? false,
    marriageAllowanceReceive: input.marriageAllowanceReceive ?? false,
    niCategoryLetter: input.niCategoryLetter ?? "A",
    employmentAllowance: input.employmentAllowance ?? false,
  };
}

type CoreResult = Omit<CalculationResult, "takeHome"> & {
  takeHome: Omit<TakeHomeResult, "marginalRate">;
};

/** Full calculation WITHOUT the marginal-rate probe (marginal probe calls
 * this, so it must not recurse). */
function calculateCore(normalized: CalculationInput): CoreResult {
  const { taxYear, region, grossAnnualSalary } = normalized;
  const pension = normalized.pension ?? DEFAULT_PENSION;
  const rules = getRules(taxYear);

  // ---- Gross pay & salary sacrifice ----
  const grossPence = toPence(grossAnnualSalary);
  let sacrificePence = 0;
  let payAfterSacrificePence = grossPence;

  if (pension.method === "salary-sacrifice" && pension.employeePercent > 0) {
    sacrificePence = roundPence(grossPence * (pension.employeePercent / 100));
    payAfterSacrificePence = positive(grossPence - sacrificePence);
  }

  // ---- Pension contributions ----
  const pensionResult = calculatePension(
    normalized,
    grossPence,
    payAfterSacrificePence
  );

  // ---- Taxable pay (income tax base) ----
  //   net-pay: employee pension deducted before tax
  //   salary-sacrifice: sacrifice already removed from gross
  //   relief-at-source / none: not deducted before tax
  let taxablePayPence = payAfterSacrificePence;
  if (pension.method === "net-pay") {
    taxablePayPence = positive(
      payAfterSacrificePence - pensionResult.employee
    );
  }

  // NI-able pay: employee pension contributions do not reduce NI-able pay;
  // only salary sacrifice does (already removed from gross).
  const niablePayPence = payAfterSacrificePence;

  // ---- Adjusted net income for Personal Allowance taper ----
  // Approximation: taxable pay plus grossed-up relief-at-source pension.
  let adjustedNetIncomePence = taxablePayPence;
  if (pension.method === "relief-at-source") {
    adjustedNetIncomePence += roundPence(pensionResult.employee / 0.8);
  }

  // ---- Income tax ----
  const incomeTax = calculateIncomeTax(
    normalized,
    taxablePayPence,
    adjustedNetIncomePence
  );

  // ---- Employee National Insurance ----
  const nationalInsurance = calculateEmployeeNI(normalized, niablePayPence);

  // ---- Student loans (on NI-able pay as annual proxy) ----
  const studentLoan = calculateStudentLoan(normalized, niablePayPence);

  // ---- Employer NI ----
  const employerNi = calculateEmployerNI(normalized, niablePayPence);

  // ---- Employer result ----
  const employer: EmployerResult = {
    ni: employerNi.ni,
    pension: pensionResult.employer,
    totalCost: grossPence + employerNi.ni + pensionResult.employer,
    employmentAllowanceBenefit: employerNi.employmentAllowanceBenefit,
  };

  // ---- Take-home pay ----
  // Deductions: income tax + employee NI + employee pension (net cost) +
  // student loan. Salary-sacrifice amounts are already excluded from
  // payAfterSacrificePence, so they are not subtracted again.
  const deductionsTotal = sumPence(
    incomeTax.total,
    nationalInsurance.total,
    pensionResult.employee,
    studentLoan.total
  );
  const takeHomeAnnualPence = positive(
    payAfterSacrificePence - deductionsTotal
  );

  const effectiveRate = grossPence > 0 ? deductionsTotal / grossPence : 0;

  return {
    meta: {
      taxYear,
      region,
      currency: "GBP",
      rulesVersion: rules.rulesVersion,
    },
    gross: {
      annual: grossPence,
      monthly: roundPence(grossPence / 12),
      weekly: roundPence(grossPence / 52),
    },
    incomeTax,
    nationalInsurance,
    studentLoan,
    pension: pensionResult,
    employer,
    takeHome: {
      annual: takeHomeAnnualPence,
      monthly: roundPence(takeHomeAnnualPence / 12),
      weekly: roundPence(takeHomeAnnualPence / 52),
      effectiveRate,
    },
    deductionsTotal,
  };
}

/** Marginal rate via a £1 gross-pay probe (non-recursive). */
function computeMarginalRate(normalized: CalculationInput): number {
  const basePence = toPence(normalized.grossAnnualSalary);
  const base = calculateCore(normalized);
  const higher = calculateCore({
    ...normalized,
    grossAnnualSalary: toPounds(basePence + toPence(1)),
  });

  const grossChange = higher.gross.annual - base.gross.annual;
  const netChange = higher.takeHome.annual - base.takeHome.annual;

  if (grossChange <= 0) return 0;
  return clamp(1 - netChange / grossChange, 0, 1);
}

export function calculate(input: Partial<CalculationInput>): CalculationResult {
  const normalized = normalizeInput(input);
  const core = calculateCore(normalized);
  const marginalRate = computeMarginalRate(normalized);
  return {
    ...core,
    takeHome: { ...core.takeHome, marginalRate },
  };
}
