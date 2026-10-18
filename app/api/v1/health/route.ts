import { jsonResponse, optionsResponse } from "@/lib/api/respond";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  return jsonResponse(
    { status: "ok", service: "uk-tax-calculator", version: "1.0.0" },
    200,
    { "Cache-Control": "public, s-maxage=60" }
  );
}
