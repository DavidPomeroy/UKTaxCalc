import { z } from "zod";
import { calculate } from "@/lib/tax/calculate";
import { CalculationRequestSchema } from "@/lib/schemas/calculation";
import { serializeCalculation } from "@/lib/api/serialize";
import {
  jsonResponse,
  validationProblem,
  problemResponse,
  optionsResponse,
} from "@/lib/api/respond";
import { checkRateLimit, clientKey } from "@/lib/api/rate-limit";

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  const limit = checkRateLimit(`calc:${clientKey(request)}`);
  if (!limit.allowed) {
    return problemResponse(
      429,
      "Rate limit exceeded",
      `Too many requests. Try again in ${limit.retryAfterSeconds} seconds.`
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationProblem([
      { path: "body", message: "Request body must be valid JSON." },
    ]);
  }

  const parsed = CalculationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationProblem(
      parsed.error.issues.map((issue) => ({
        path: issue.path.map(String).join(".") || "body",
        message: issue.message,
      }))
    );
  }

  try {
    const result = calculate(parsed.data);
    return jsonResponse(serializeCalculation(result), 200, {
      "Cache-Control": "no-store",
      "X-RateLimit-Limit": String(limit.limit),
      "X-RateLimit-Remaining": String(limit.remaining),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return problemResponse(500, "Calculation failed", message);
  }
}
