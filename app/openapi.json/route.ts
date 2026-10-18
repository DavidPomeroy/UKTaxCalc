import { buildOpenApiDocument } from "@/lib/openapi/document";
import { withCors } from "@/lib/api/respond";

export async function GET() {
  const document = buildOpenApiDocument();
  return Response.json(document, {
    headers: withCors({
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    }),
  });
}
