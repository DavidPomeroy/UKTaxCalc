import { z } from "zod";
import { calculate } from "@/lib/tax/calculate";
import { serializeCalculation } from "@/lib/api/serialize";
import {
  jsonResponse,
  validationProblem,
  problemResponse,
  optionsResponse,
} from "@/lib/api/respond";
import { checkRateLimit, clientKey } from "@/lib/api/rate-limit";

const querySchema = z.object({
  salary: z.coerce.number().min(0).max(10_000_000),
  region: z
    .enum(["england", "wales", "scotland", "northern-ireland"])
    .default("england"),
  taxYear: z.enum(["2025/26", "2026/27"]).optional(),
  loans: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .pipe(
      z.array(
        z.enum(["plan1", "plan2", "plan4", "plan5", "postgraduate"])
      )
    ),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const limit = checkRateLimit(`quick:${clientKey(request)}`);
  if (!limit.allowed) {
    return problemResponse(
      429,
      "Rate limit exceeded",
      `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.`
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries())
  );
  if (!parsed.success) {
    return validationProblem(
      parsed.error.issues.map((issue) => ({
        path: issue.path.map(String).join(".") || "query",
        message: issue.message,
      }))
    );
  }

  try {
    const result = calculate({
      grossAnnualSalary: parsed.data.salary,
      region: parsed.data.region,
      taxYear: parsed.data.taxYear,
      studentLoans: parsed.data.loans,
    });
    return jsonResponse(serializeCalculation(result), 200, {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return problemResponse(500, "Calculation failed", message);
  }
}
