import type { CalculationResult } from "@/lib/tax/types";
import type { PayrollPeriodResult, PeriodAmounts } from "@/lib/tax/pay-period";

/** Round a pence integer to pounds with 2 decimals, for API output. */
export function penceToPounds(pence: number): number {
  return Math.round(pence) / 100;
}

function mapBand(band: { name: string; rate: number; amount: number; tax: number }) {
  return {
    name: band.name,
    rate: band.rate,
    amount: penceToPounds(band.amount),
    tax: penceToPounds(band.tax),
  };
}

/** Convert the internal pence-based CalculationResult into the public
 * pounds-based API response shape. */
export function serializeCalculation(result: CalculationResult) {
  const periodic = (annual: number, monthly: number, weekly: number) => ({
    annual: penceToPounds(annual),
    monthly: penceToPounds(monthly),
    weekly: penceToPounds(weekly),
  });

  return {
    meta: result.meta,
    gross: periodic(
      result.gross.annual,
      result.gross.monthly,
      result.gross.weekly
    ),
    incomeTax: {
      total: penceToPounds(result.incomeTax.total),
      personalAllowance: penceToPounds(result.incomeTax.personalAllowance),
      taxableIncome: penceToPounds(result.incomeTax.taxableIncome),
      bands: result.incomeTax.bands.map(mapBand),
      marginalRate: result.incomeTax.marginalRate,
    },
    nationalInsurance: {
      total: penceToPounds(result.nationalInsurance.total),
      bands: result.nationalInsurance.bands.map(mapBand),
    },
    studentLoan: {
      total: penceToPounds(result.studentLoan.total),
      plans: result.studentLoan.plans.map((p) => ({
        plan: p.plan,
        amount: penceToPounds(p.amount),
        threshold: penceToPounds(p.threshold),
        rate: p.rate,
      })),
    },
    pension: {
      employee: penceToPounds(result.pension.employee),
      employer: penceToPounds(result.pension.employer),
      salarySacrifice: penceToPounds(result.pension.salarySacrifice),
      grossContribution: penceToPounds(result.pension.grossContribution),
      method: result.pension.method,
    },
    employer: {
      ni: penceToPounds(result.employer.ni),
      pension: penceToPounds(result.employer.pension),
      totalCost: penceToPounds(result.employer.totalCost),
      employmentAllowanceBenefit: penceToPounds(
        result.employer.employmentAllowanceBenefit
      ),
    },
    takeHome: {
      ...periodic(
        result.takeHome.annual,
        result.takeHome.monthly,
        result.takeHome.weekly
      ),
      effectiveRate: result.takeHome.effectiveRate,
      marginalRate: result.takeHome.marginalRate,
    },
    deductionsTotal: penceToPounds(result.deductionsTotal),
  };
}

export type SerializedCalculation = ReturnType<typeof serializeCalculation>;

function periodAmounts(a: PeriodAmounts) {
  return {
    gross: penceToPounds(a.gross),
    salarySacrifice: penceToPounds(a.salarySacrifice),
    incomeTax: penceToPounds(a.incomeTax),
    employeeNi: penceToPounds(a.employeeNi),
    employerNi: penceToPounds(a.employerNi),
    pensionEmployee: penceToPounds(a.pensionEmployee),
    pensionEmployer: penceToPounds(a.pensionEmployer),
    studentLoan: penceToPounds(a.studentLoan),
    net: penceToPounds(a.net),
  };
}

/** Convert a payroll period result (pence) into the public pounds shape. */
export function serializePayrollPeriod(result: PayrollPeriodResult) {
  return {
    frequency: result.frequency,
    periodNumber: result.periodNumber,
    taxBasis: result.taxBasis,
    periodsPerYear: result.periodsPerYear,
    thisPeriod: periodAmounts(result.thisPeriod),
    yearToDate: periodAmounts(result.yearToDate),
  };
}

export type SerializedPayrollPeriod = ReturnType<typeof serializePayrollPeriod>;
