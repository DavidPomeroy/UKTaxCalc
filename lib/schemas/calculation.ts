import { z } from "zod";
import "zod-openapi";

const taxYearSchema = z
  .enum(["2025/26", "2026/27"])
  .meta({ description: "UK tax year", example: "2026/27" });

const regionSchema = z
  .enum(["england", "wales", "scotland", "northern-ireland"])
  .meta({
    description: "UK nation. Wales uses the same rates as England/NI.",
    example: "england",
  });

const pensionMethodSchema = z
  .enum(["net-pay", "salary-sacrifice", "relief-at-source", "none"])
  .meta({
    description:
      "Pension tax-relief basis. Net-pay deducts before tax; salary-sacrifice reduces gross pay; relief-at-source deducts from net pay.",
    example: "net-pay",
  });

const pensionBasisSchema = z
  .enum(["qualifying-earnings", "pensionable-earnings", "gross-pay"])
  .meta({
    description: "Earnings on which the percentage contribution is based.",
    example: "qualifying-earnings",
  });

const studentLoanPlanSchema = z
  .enum(["plan1", "plan2", "plan4", "plan5", "postgraduate"])
  .meta({ description: "Student loan repayment plan", example: "plan2" });

export const PensionInputSchema = z
  .object({
    method: pensionMethodSchema.default("none"),
    employeePercent: z
      .number()
      .min(0)
      .max(100)
      .default(0)
      .meta({ description: "Employee contribution as % of earnings", example: 5 }),
    employerPercent: z
      .number()
      .min(0)
      .max(100)
      .default(0)
      .meta({ description: "Employer contribution as % of earnings", example: 3 }),
    basis: pensionBasisSchema.default("qualifying-earnings"),
  })
  .meta({ id: "PensionInput" });

export const CalculationRequestSchema = z
  .object({
    taxYear: taxYearSchema.optional().meta({
      description: "Defaults to the current tax year.",
    }),
    region: regionSchema.default("england"),
    grossAnnualSalary: z
      .number()
      .min(0)
      .max(10_000_000)
      .meta({ description: "Gross annual salary in pounds", example: 60000 }),
    payFrequency: z
      .enum(["annual", "monthly", "weekly"])
      .default("annual")
      .meta({ description: "Frequency for per-period display figures" }),
    pension: PensionInputSchema.optional().meta({
      description: "Workplace pension contribution details",
    }),
    studentLoans: z.array(studentLoanPlanSchema).default([]).meta({
      description:
        "Student loan plans to repay (can combine e.g. Plan 2 + Postgraduate)",
      example: ["plan2"],
    }),
    taxCode: z.string().max(8).optional().meta({
      description:
        'PAYE tax code, e.g. "1257L", "BR", "D0", "NT". Defaults to standard allowance.',
      example: "1257L",
    }),
    customPersonalAllowance: z.number().min(0).max(1_000_000).optional().meta({
      description: "Override personal allowance in pounds",
    }),
    blindPersonsAllowance: z.boolean().default(false).meta({
      description: "Add Blind Person's Allowance to personal allowance",
    }),
    marriageAllowanceTransfer: z.boolean().default(false).meta({
      description: "Transfer £1,260 of personal allowance to a partner",
    }),
    marriageAllowanceReceive: z.boolean().default(false).meta({
      description: "Receive £1,260 of personal allowance from a partner",
    }),
    niCategoryLetter: z
      .enum(["A", "B", "C", "D", "E", "F", "H", "I", "J", "K", "L", "M", "N", "S", "V", "Z"])
      .default("A")
      .meta({
        description: "Employee NI category letter. Only A is modelled in detail.",
        example: "A",
      }),
    employmentAllowance: z.boolean().default(false).meta({
      description: "Apply £10,500 Employment Allowance against employer NI",
    }),
  })
  .meta({ id: "CalculationRequest" });

export const BandResultSchema = z
  .object({
    name: z.string().meta({ example: "basic" }),
    rate: z.number().meta({ description: "Rate as a decimal", example: 0.2 }),
    amount: z.number().meta({ description: "Pounds of income in this band" }),
    tax: z.number().meta({ description: "Pounds of tax/deduction in this band" }),
  })
  .meta({ id: "BandResult" });

export const IncomeTaxSchema = z
  .object({
    total: z.number().meta({ example: 11432 }),
    personalAllowance: z.number().meta({ example: 12570 }),
    taxableIncome: z.number().meta({ example: 47430 }),
    bands: z.array(BandResultSchema),
    marginalRate: z.number().meta({ example: 0.4 }),
  })
  .meta({ id: "IncomeTax" });

export const NISchema = z
  .object({
    total: z.number().meta({ example: 3210.6 }),
    bands: z.array(BandResultSchema),
  })
  .meta({ id: "NationalInsurance" });

export const StudentLoanPlanResultSchema = z
  .object({
    plan: z
      .enum(["plan1", "plan2", "plan4", "plan5", "postgraduate"])
      .meta({ example: "plan2" }),
    amount: z.number().meta({ example: 955.35 }),
    threshold: z.number().meta({ example: 29385 }),
    rate: z.number().meta({ example: 0.09 }),
  })
  .meta({ id: "StudentLoanPlanResult" });

export const StudentLoanSchema = z
  .object({
    total: z.number().meta({ example: 955.35 }),
    plans: z.array(StudentLoanPlanResultSchema),
  })
  .meta({ id: "StudentLoan" });

export const PensionResultSchema = z
  .object({
    employee: z.number().meta({ example: 1688 }),
    employer: z.number().meta({ example: 1012.8 }),
    salarySacrifice: z.number().meta({ example: 0 }),
    grossContribution: z.number().meta({ example: 2700.8 }),
    method: z.enum(["net-pay", "salary-sacrifice", "relief-at-source", "none"]),
  })
  .meta({ id: "PensionResult" });

export const EmployerResultSchema = z
  .object({
    ni: z.number().meta({ example: 8250 }),
    pension: z.number().meta({ example: 1012.8 }),
    totalCost: z.number().meta({ example: 69262.8 }),
    employmentAllowanceBenefit: z.number().meta({ example: 0 }),
  })
  .meta({ id: "EmployerResult" });

const moneyBlockSchema = z.object({
  annual: z.number(),
  monthly: z.number(),
  weekly: z.number(),
});

export const CalculationResponseSchema = z
  .object({
    meta: z.object({
      taxYear: z.enum(["2025/26", "2026/27"]),
      region: z.enum(["england", "wales", "scotland", "northern-ireland"]),
      currency: z.literal("GBP"),
      rulesVersion: z.string().meta({ example: "2026.1" }),
    }),
    gross: moneyBlockSchema,
    incomeTax: IncomeTaxSchema,
    nationalInsurance: NISchema,
    studentLoan: StudentLoanSchema,
    pension: PensionResultSchema,
    employer: EmployerResultSchema,
    takeHome: moneyBlockSchema.extend({
      effectiveRate: z.number().meta({ example: 0.244 }),
      marginalRate: z.number().meta({ example: 0.42 }),
    }),
    deductionsTotal: z.number(),
  })
  .meta({ id: "CalculationResponse", outputId: "CalculationResponse" });

export const ProblemSchema = z
  .object({
    type: z.string().meta({
      example: "https://api.uktax.example/problems/validation",
    }),
    title: z.string().meta({ example: "Validation failed" }),
    status: z.number().meta({ example: 400 }),
    detail: z.string(),
    errors: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  })
  .meta({ id: "Problem" });

export const TaxYearsResponseSchema = z
  .object({
    current: z.enum(["2025/26", "2026/27"]),
    years: z.array(
      z.object({
        taxYear: z.enum(["2025/26", "2026/27"]),
        rulesVersion: z.string(),
        startsOn: z.string(),
        endsOn: z.string(),
      })
    ),
  })
  .meta({ id: "TaxYearsResponse" });
