export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

export function withCors(headers: HeadersInit = {}): HeadersInit {
  return { ...CORS_HEADERS, ...headers };
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: HeadersInit = {}
): Response {
  return Response.json(body, {
    status,
    headers: withCors({
      "Content-Type": "application/json",
      ...extraHeaders,
    }),
  });
}

export interface FieldError {
  path: string;
  message: string;
}

export function problemResponse(
  status: number,
  title: string,
  detail: string,
  errors?: FieldError[]
): Response {
  return jsonResponse(
    {
      type: "https://api.uktax.example/problems/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title,
      status,
      detail,
      ...(errors ? { errors } : {}),
    },
    status
  );
}

export function validationProblem(errors: FieldError[]): Response {
  return problemResponse(
    400,
    "Validation failed",
    "One or more fields are invalid.",
    errors
  );
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: withCors() });
}
