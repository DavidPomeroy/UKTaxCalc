import {
  CURRENT_TAX_YEAR,
  SUPPORTED_TAX_YEARS,
  getRules,
} from "@/lib/tax/rules";
import { jsonResponse, optionsResponse } from "@/lib/api/respond";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  const years = SUPPORTED_TAX_YEARS.map((taxYear) => {
    const rules = getRules(taxYear);
    const startYear = taxYear === "2026/27" ? 2026 : 2025;
    return {
      taxYear,
      rulesVersion: rules.rulesVersion,
      startsOn: `${startYear}-04-06`,
      endsOn: `${startYear + 1}-04-05`,
    };
  });

  return jsonResponse(
    { current: CURRENT_TAX_YEAR, years },
    200,
    { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
  );
}
