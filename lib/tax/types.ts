export type TaxYear = "2025/26" | "2026/27";
export type Region = "england" | "wales" | "scotland" | "northern-ireland";
export type PensionMethod = "net-pay" | "salary-sacrifice" | "relief-at-source" | "none";
export type PensionBasis = "qualifying-earnings" | "pensionable-earnings" | "gross-pay";
export type StudentLoanPlan = "plan1" | "plan2" | "plan4" | "plan5" | "postgraduate";
export const NICategoryLetters = ["A", "B", "C", "D", "E", "F", "H", "I", "J", "K", "L", "M", "N", "S", "V", "Z"] as const;
export type NICategoryLetter = (typeof NICategoryLetters)[number];

export interface PensionInput {
  method: PensionMethod;
  employeePercent: number; // 0-100
  employerPercent: number; // 0-100
  basis: PensionBasis;
}

export interface CalculationInput {
  taxYear: TaxYear;
  region: Region;
  grossAnnualSalary: number; // pounds
  payFrequency?: "annual" | "monthly" | "weekly";
  pension?: PensionInput;
  studentLoans: StudentLoanPlan[];
  taxCode?: string;
  customPersonalAllowance?: number; // pounds override
  blindPersonsAllowance?: boolean;
  marriageAllowanceTransfer?: boolean; // transfer £1,260 of PA away
  marriageAllowanceReceive?: boolean; // receive £1,260 of PA
  niCategoryLetter?: NICategoryLetter;
  employmentAllowance?: boolean; // employer NI reduction
}

export interface TaxBand {
  name: string;
  rate: number;
  /** Start boundary in TAXABLE pounds (converted to pence inside
   * calculators). Adjacent bands share a boundary. */
  lower: number;
  /** End boundary in TAXABLE pounds; Infinity for open-ended. The band is
   * (upper − lower) wide. */
  upper: number;
}

export interface BandResult {
  name: string;
  rate: number;
  amount: number; // pence in band
  tax: number; // pence tax on band
}

export interface IncomeTaxResult {
  total: number; // pence
  personalAllowance: number; // pence after taper/allowances
  taxableIncome: number; // pence
  bands: BandResult[];
  marginalRate: number;
}

export interface NIResult {
  total: number; // pence
  bands: BandResult[];
}

export interface StudentLoanResult {
  total: number; // pence
  plans: Array<{ plan: StudentLoanPlan; amount: number; threshold: number; rate: number }>;
}

export interface PensionResult {
  employee: number; // pence deducted from take-home (0 for salary-sacrifice)
  employer: number; // pence
  salarySacrifice: number; // pence given up pre-tax (salary-sacrifice only)
  grossContribution: number; // pence total into pot (incl. basic-rate uplift for RAS)
  method: PensionMethod;
}

export interface EmployerResult {
  ni: number; // pence
  pension: number; // pence
  totalCost: number; // pence = gross + employerNI + employerPension
  employmentAllowanceBenefit: number; // pence
}

export interface TakeHomeResult {
  annual: number; // pence
  monthly: number; // pence
  weekly: number; // pence
  effectiveRate: number; // 0-1
  marginalRate: number; // 0-1
}

export interface CalculationResult {
  meta: {
    taxYear: TaxYear;
    region: Region;
    currency: "GBP";
    rulesVersion: string;
  };
  gross: { annual: number; monthly: number; weekly: number }; // pence
  incomeTax: IncomeTaxResult;
  nationalInsurance: NIResult;
  studentLoan: StudentLoanResult;
  pension: PensionResult;
  employer: EmployerResult;
  takeHome: TakeHomeResult;
  deductionsTotal: number; // pence
}
