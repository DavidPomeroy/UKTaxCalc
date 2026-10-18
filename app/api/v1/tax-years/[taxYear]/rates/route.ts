import { z } from "zod";
import { getRules } from "@/lib/tax/rules";
import {
  jsonResponse,
  problemResponse,
  optionsResponse,
} from "@/lib/api/respond";

const ratesResponseSchema = z.object({
  taxYear: z.string(),
  rulesVersion: z.string(),
  personalAllowance: z.number(),
  paTaperThreshold: z.number(),
  blindPersonsAllowance: z.number(),
  marriageAllowanceTransfer: z.number(),
  incomeTax: z.record(
    z.string(),
    z.array(
      z.object({
        name: z.string(),
        rate: z.number(),
        lower: z.number().nullable(),
        upper: z.number().nullable(),
      })
    )
  ),
  nationalInsurance: z.object({
    primaryThreshold: z.number(),
    upperEarningsLimit: z.number(),
    mainRate: z.number(),
    upperRate: z.number(),
  }),
  employerNationalInsurance: z.object({
    secondaryThreshold: z.number(),
    rate: z.number(),
  }),
  employmentAllowance: z.number(),
  studentLoans: z.record(
    z.string(),
    z.object({ threshold: z.number(), rate: z.number() })
  ),
  pension: z.object({
    earningsTrigger: z.number(),
    qualifyingEarningsLower: z.number(),
    qualifyingEarningsUpper: z.number(),
    minEmployeePercent: z.number(),
    minEmployerPercent: z.number(),
  }),
});

export async function OPTIONS() {
  return optionsResponse();
}

interface RatesRouteParams {
  params: Promise<{ taxYear: string }>;
}

export async function GET(_request: Request, { params }: RatesRouteParams) {
  const { taxYear: raw } = await params;
  const taxYear = raw.replace("-", "/");

  if (taxYear !== "2025/26" && taxYear !== "2026/27") {
    return problemResponse(
      404,
      "Unknown tax year",
      `No rates for tax year "${raw}". Supported years: 2025-26, 2026-27.`
    );
  }

  const rules = getRules(taxYear);
  const noInfinity = (value: number) => (value === Infinity ? null : value);

  const payload = ratesResponseSchema.parse({
    taxYear,
    rulesVersion: rules.rulesVersion,
    personalAllowance: rules.personalAllowance,
    paTaperThreshold: rules.paTaperThreshold,
    blindPersonsAllowance: rules.blindPersonsAllowance,
    marriageAllowanceTransfer: rules.marriageAllowanceTransfer,
    incomeTax: Object.fromEntries(
      Object.entries(rules.incomeTax).map(([region, bands]) => [
        region,
        bands.map((b) => ({
          name: b.name,
          rate: b.rate,
          lower: noInfinity(b.lower),
          upper: noInfinity(b.upper),
        })),
      ])
    ),
    nationalInsurance: rules.nationalInsurance,
    employerNationalInsurance: rules.employerNationalInsurance,
    employmentAllowance: rules.employmentAllowance,
    studentLoans: rules.studentLoans,
    pension: rules.pension,
  });

  return jsonResponse(payload, 200, {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  });
}
