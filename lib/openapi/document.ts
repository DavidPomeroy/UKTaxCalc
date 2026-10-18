import { z } from "zod";
import { createDocument, type ZodOpenApiPathsObject } from "zod-openapi";
import {
  CalculationRequestSchema,
  CalculationResponseSchema,
  ProblemSchema,
  TaxYearsResponseSchema,
} from "@/lib/schemas/calculation";

const calculationExample = {
  taxYear: "2026/27",
  region: "england",
  grossAnnualSalary: 45000,
  payFrequency: "monthly",
  periodNumber: 6,
  taxBasis: "cumulative",
  taxCode: "432L",
  pension: {
    method: "relief-at-source",
    employeePercent: 4,
    employerPercent: 3,
    basis: "qualifying-earnings",
  },
  studentLoans: [],
};

function problemRef(description: string) {
  return {
    description,
    content: {
      "application/problem+json": { schema: ProblemSchema },
    },
  };
}

const quickQuerySchema = z.object({
  salary: z
    .number()
    .min(0)
    .max(10_000_000)
    .meta({ description: "Gross annual salary in pounds", example: 35000 }),
  region: z
    .enum(["england", "wales", "scotland", "northern-ireland"])
    .default("england")
    .meta({ example: "scotland" }),
  taxYear: z
    .enum(["2025/26", "2026/27"])
    .optional()
    .meta({ description: "Defaults to the current tax year" }),
  loans: z
    .array(z.enum(["plan1", "plan2", "plan4", "plan5", "postgraduate"]))
    .optional()
    .meta({
      description: "Repeat or comma-separate, e.g. ?loans=plan2,postgraduate",
    }),
});

const ratesPathSchema = z.object({
  taxYear: z
    .enum(["2025-26", "2026-27"])
    .meta({ description: "Tax year using a dash, e.g. 2026-27", example: "2026-27" }),
});

const paths: ZodOpenApiPathsObject = {
  "/api/v1/calculations": {
    post: {
      tags: ["Calculations"],
      operationId: "calculateTakeHome",
      summary: "Calculate a full take-home pay breakdown",
      description:
        "Runs a server-side PAYE calculation (income tax, NI, student loans, pension) and returns an itemised breakdown in pounds. " +
        "Set payFrequency to monthly or weekly (with an optional periodNumber and taxBasis) to additionally receive a payroll block " +
        "using HMRC's per-period thresholds and cumulative PAYE, including year-to-date figures.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: CalculationRequestSchema,
            example: calculationExample,
          },
        },
      },
      responses: {
        "200": {
          description: "Itemised calculation result",
          content: {
            "application/json": { schema: CalculationResponseSchema },
          },
        },
        "400": problemRef("Request failed validation"),
        "429": problemRef("Rate limit exceeded"),
        "500": problemRef("Calculation failed"),
      },
    },
  },
  "/api/v1/take-home-pay": {
    get: {
      tags: ["Calculations"],
      operationId: "quickTakeHome",
      summary: "Quick take-home lookup via query params",
      description:
        "Simplified calculation for a salary/region/year (plus optional student loans).",
      requestParams: { query: quickQuerySchema },
      responses: {
        "200": {
          description: "Itemised calculation result",
          content: {
            "application/json": { schema: CalculationResponseSchema },
          },
        },
        "400": problemRef("Query failed validation"),
        "429": problemRef("Rate limit exceeded"),
      },
    },
  },
  "/api/v1/tax-years": {
    get: {
      tags: ["Rates"],
      operationId: "listTaxYears",
      summary: "List supported tax years",
      responses: {
        "200": {
          description: "Supported years and rules versions",
          content: {
            "application/json": { schema: TaxYearsResponseSchema },
          },
        },
      },
    },
  },
  "/api/v1/tax-years/{taxYear}/rates": {
    get: {
      tags: ["Rates"],
      operationId: "getRates",
      summary: "Get the full rate tables for a tax year",
      requestParams: { path: ratesPathSchema },
      responses: {
        "200": { description: "Rate tables" },
        "404": problemRef("Unknown tax year"),
      },
    },
  },
  "/api/v1/health": {
    get: {
      tags: ["Meta"],
      operationId: "health",
      summary: "Service health check",
      responses: {
        "200": { description: "Service is healthy" },
      },
    },
  },
};

export function buildOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "UK Tax Calculator API",
      version: "1.0.0",
      description:
        "Server-side UK take-home pay calculations (income tax, National Insurance, student loans, pensions). " +
        "Stateless, no authentication, CORS enabled. Estimates only — not financial or tax advice. " +
        "Rules verified against GOV.UK for 2025/26 and 2026/27.",
      license: { name: "MIT" },
    },
    servers: [
      {
        url: "/",
        description:
          "Current origin (works on localhost, previews and production)",
      },
    ],
    tags: [
      { name: "Calculations", description: "Run take-home pay calculations" },
      {
        name: "Rates",
        description: "Inspect the rule sets behind the calculations",
      },
      { name: "Meta", description: "Service metadata" },
    ],
    paths,
  });
}

export type OpenApiDocument = ReturnType<typeof buildOpenApiDocument>;
