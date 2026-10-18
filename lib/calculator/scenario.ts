import type {
  CalculationInput,
  Region,
  StudentLoanPlan,
  TaxYear,
} from "@/lib/tax/types";
import { CURRENT_TAX_YEAR } from "@/lib/tax/rules";

export type Scenario = CalculationInput;

export const DEFAULT_SCENARIO: Scenario = {
  taxYear: CURRENT_TAX_YEAR,
  region: "england",
  grossAnnualSalary: 35000,
  payFrequency: "annual",
  pension: {
    method: "none",
    employeePercent: 5,
    employerPercent: 3,
    basis: "qualifying-earnings",
  },
  studentLoans: [],
  taxCode: "1257L",
  customPersonalAllowance: undefined,
  blindPersonsAllowance: false,
  marriageAllowanceTransfer: false,
  marriageAllowanceReceive: false,
  niCategoryLetter: "A",
  employmentAllowance: false,
};

const REGIONS: Region[] = ["england", "wales", "scotland", "northern-ireland"];
const TAX_YEARS: TaxYear[] = ["2026/27", "2025/26"];
const LOANS: StudentLoanPlan[] = ["plan1", "plan2", "plan4", "plan5", "postgraduate"];

function num(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function bool(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
}

export type SearchParams = Record<string, string | string[] | undefined>;

/** Parse URL search params into a full Scenario (server-safe). */
export function scenarioFromSearchParams(sp: SearchParams): Scenario {
  const taxYear = (Array.isArray(sp.taxYear) ? sp.taxYear[0] : sp.taxYear) as
    | TaxYear
    | undefined;
  const region = (Array.isArray(sp.region) ? sp.region[0] : sp.region) as
    | Region
    | undefined;
  const rawLoans = sp.loans;
  const loans = (Array.isArray(rawLoans)
    ? rawLoans.flatMap((v) => v.split(","))
    : (rawLoans ?? "").split(",")
  )
    .map((s) => s.trim())
    .filter((s): s is StudentLoanPlan => LOANS.includes(s as StudentLoanPlan));

  const salary = num(sp.salary);
  const pensionOn = bool(sp.pension);
  const method = (
    Array.isArray(sp.pensionMethod) ? sp.pensionMethod[0] : sp.pensionMethod
  ) as Scenario["pension"] extends infer P
    ? P extends { method: infer M }
      ? M
      : never
    : never;

  return {
    taxYear: taxYear && TAX_YEARS.includes(taxYear) ? taxYear : DEFAULT_SCENARIO.taxYear,
    region: region && REGIONS.includes(region) ? region : DEFAULT_SCENARIO.region,
    grossAnnualSalary:
      salary !== undefined
        ? Math.min(10_000_000, Math.max(0, salary))
        : DEFAULT_SCENARIO.grossAnnualSalary,
    payFrequency: DEFAULT_SCENARIO.payFrequency,
    pension: {
      method: pensionOn
        ? method === "net-pay" ||
          method === "salary-sacrifice" ||
          method === "relief-at-source"
          ? method
          : "net-pay"
        : "none",
      employeePercent:
        num(sp.pensionEmployee) ?? DEFAULT_SCENARIO.pension!.employeePercent,
      employerPercent:
        num(sp.pensionEmployer) ?? DEFAULT_SCENARIO.pension!.employerPercent,
      basis: "qualifying-earnings",
    },
    studentLoans: loans,
    taxCode:
      (Array.isArray(sp.taxCode) ? sp.taxCode[0] : sp.taxCode) ||
      DEFAULT_SCENARIO.taxCode,
    customPersonalAllowance: undefined,
    blindPersonsAllowance: bool(sp.blind),
    marriageAllowanceTransfer: bool(sp.marriageOut),
    marriageAllowanceReceive: bool(sp.marriageIn),
    niCategoryLetter: "A",
    employmentAllowance: bool(sp.employerAllowance),
  };
}

/** Serialize a Scenario back into URL search params (omits defaults). */
export function scenarioToSearchParams(s: Scenario): URLSearchParams {
  const params = new URLSearchParams();
  const d = DEFAULT_SCENARIO;
  if (s.taxYear !== d.taxYear) params.set("taxYear", s.taxYear);
  if (s.region !== d.region) params.set("region", s.region);
  if (s.grossAnnualSalary !== d.grossAnnualSalary)
    params.set("salary", String(s.grossAnnualSalary));
  if (s.pension && s.pension.method !== "none") {
    params.set("pension", "1");
    params.set("pensionMethod", s.pension.method);
    params.set("pensionEmployee", String(s.pension.employeePercent));
    params.set("pensionEmployer", String(s.pension.employerPercent));
  }
  if (s.studentLoans.length > 0) params.set("loans", s.studentLoans.join(","));
  if (s.taxCode && s.taxCode !== d.taxCode) params.set("taxCode", s.taxCode);
  if (s.blindPersonsAllowance) params.set("blind", "1");
  if (s.marriageAllowanceTransfer) params.set("marriageOut", "1");
  if (s.marriageAllowanceReceive) params.set("marriageIn", "1");
  if (s.employmentAllowance) params.set("employerAllowance", "1");
  return params;
}

/** Format integer pence as GBP. */
export function formatGBP(
  pence: number,
  opts: { decimals?: number; compact?: boolean } = {}
): string {
  const { decimals = 2, compact = false } = opts;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? "compact" : "standard",
  }).format(pence / 100);
}

export function formatPercent(rate: number, decimals = 1): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

export const REGION_LABELS: Record<Region, string> = {
  england: "England",
  wales: "Wales",
  scotland: "Scotland",
  "northern-ireland": "Northern Ireland",
};

export const LOAN_LABELS: Record<StudentLoanPlan, string> = {
  plan1: "Plan 1",
  plan2: "Plan 2",
  plan4: "Plan 4 (Scotland)",
  plan5: "Plan 5",
  postgraduate: "Postgraduate",
};
