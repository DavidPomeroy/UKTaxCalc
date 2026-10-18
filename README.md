# UK Tax Calculator

A UK take-home pay calculator built with **Next.js 16**, **shadcn/ui** and
TypeScript. All calculations run on the server against versioned,
GOV.UK-verified tax rules — no database, no accounts, no stored data.

## What it does

Enter a gross salary and get a full annual breakdown:

- **Income tax** — England, Wales, Scotland and Northern Ireland bands
  (2025/26 and 2026/27), including the £12,570 Personal Allowance, the
  £100k taper, Blind Person's Allowance, Marriage Allowance and PAYE tax codes
- **National Insurance** — Class 1 employee (8% to £50,270, 2% above) and
  employer NI (15% above £5,000), optional £10,500 Employment Allowance
- **Student loans** — Plan 1, 2, 4, 5 and Postgraduate (single or combined)
- **Workplace pensions** — net-pay, salary-sacrifice and relief-at-source,
  on qualifying earnings or full pay
- **Take-home pay** — annual, monthly and weekly, plus effective and
  marginal rates, and total employer cost

## Current status

Implemented and tested:

- `lib/tax/` — the calculation engine (integer-pence arithmetic)
- `lib/tax/rules/` — versioned 2025/26 and 2026/27 rule sets
- `tests/` — 27 unit tests, all passing (`pnpm test`)
- `lib/schemas/calculation.ts` — Zod request/response schemas for the API

Coming next:

- The calculator UI (`app/page.tsx` is still the Next.js starter page)
- Public API routes under `app/api/v1/`
- OpenAPI document at `/openapi.json` and interactive docs at `/scalar`

## Getting started

Requirements: Node.js ≥ 20, [pnpm](https://pnpm.io) 10.

```bash
pnpm install
pnpm dev      # starts on http://localhost:3015
```

Other scripts:

```bash
pnpm test        # run the 27 unit tests (vitest)
pnpm test:watch  # watch mode
pnpm typecheck   # tsc --noEmit
pnpm lint
pnpm build
pnpm start       # production server, also on :3015
```

## Using the UI (planned)

The calculator page is a server-rendered form: every figure you see is
computed on the server, never in the browser.

1. **Gross annual salary** — type an amount or use the slider.
2. **Tax year** — `2026/27` (current) or `2025/26`.
3. **Where you live** — England, Wales, Scotland or Northern Ireland
   (Scottish bands apply to Scottish taxpayers; Wales matches England).
4. **Pension** — enable it, pick `net-pay`, `salary-sacrifice` or
   `relief-at-source`, and enter employee/employer percentages.
5. **Student loan** — tick any combination of Plan 1, 2, 4, 5 and
   Postgraduate (Plan 2 + Postgraduate is common).
6. **Advanced** — PAYE tax code (e.g. `1257L`, `BR`, `D0`, `NT`),
   Blind Person's Allowance, Marriage Allowance transfer/receive.

Results show annual / monthly / weekly take-home pay, an itemised
band-by-band breakdown, an effective-rate and marginal-rate summary,
employer cost, and a link that copies the current scenario as a shareable
URL (inputs live in the query string — nothing is stored server-side).

Example shareable URL once the UI lands:

```text
http://localhost:3015/?salary=60000&region=england&taxYear=2026%2F27&loans=plan2
```

## Using the API (planned)

The public API is stateless and unauthenticated, with CORS enabled so it
can be called from any site. Money is in pounds, rates are decimals.

### Endpoints

| Method | Path                                              | Purpose                              |
| ------ | ------------------------------------------------- | ------------------------------------ |
| `POST` | `/api/v1/calculations`                            | Full scenario calculation            |
| `GET`  | `/api/v1/take-home-pay?salary=&region=&taxYear=`  | Quick query-param calculation        |
| `GET`  | `/api/v1/tax-years`                               | Supported years and rules versions   |
| `GET`  | `/api/v1/tax-years/2026-27/rates`                 | Full rate tables for verification    |
| `GET`  | `/openapi.json`                                   | OpenAPI 3.1 document                 |
| `GET`  | `/scalar`                                         | Interactive API reference (try it)   |

### Example: full calculation

```bash
curl -s http://localhost:3015/api/v1/calculations \
  -H 'content-type: application/json' \
  -d '{
    "taxYear": "2026/27",
    "region": "england",
    "grossAnnualSalary": 60000,
    "pension": {
      "method": "net-pay",
      "employeePercent": 5,
      "employerPercent": 3,
      "basis": "qualifying-earnings"
    },
    "studentLoans": ["plan2"]
  }' | jq '.takeHome, .incomeTax.total, .nationalInsurance.total'
```

Request fields mirror `CalculationRequestSchema` in
`lib/schemas/calculation.ts`: `taxYear`, `region`, `grossAnnualSalary`,
`payFrequency`, `pension`, `studentLoans`, `taxCode`,
`customPersonalAllowance`, `blindPersonsAllowance`,
`marriageAllowanceTransfer`, `marriageAllowanceReceive`,
`niCategoryLetter`, `employmentAllowance`.

### Example: quick lookup

```bash
curl -s 'http://localhost:3015/api/v1/take-home-pay?salary=35000&region=scotland&taxYear=2026%2F27'
```

### Errors

Invalid input returns `400` with an RFC 9457 problem body:

```json
{
  "type": "https://api.uktax.example/problems/validation",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more fields are invalid.",
  "errors": [{ "path": "grossAnnualSalary", "message": "Must be at least 0" }]
}
```

## Tax rules and assumptions

- Rules sourced from GOV.UK for 2025/26 and 2026/27
  ([income tax](https://www.gov.uk/income-tax-rates),
  [Scotland](https://www.gov.uk/scottish-income-tax),
  [Wales](https://www.gov.uk/welsh-income-tax),
  [National Insurance](https://www.gov.uk/national-insurance-rates-letters),
  [student loans](https://www.gov.uk/repaying-your-student-loan/what-you-pay),
  [auto-enrolment](https://www.gov.uk/workplace-pensions)).
- PAYE employment income only — no self-employment, dividends, savings
  interest, rental income, benefits in kind or capital gains.
- NI and student loans use annualised thresholds and assume constant pay.
- Relief-at-source pensions include basic-rate relief only; higher-rate
  relief via self-assessment is not modelled.
- Rounding is to the nearest penny per component, so totals may differ
  from payroll software by a few pence.

**Estimates only — not financial or tax advice.**

## Project structure

```text
app/                 Next.js App Router (UI + API routes)
components/ui/       shadcn/ui primitives (hand-installed)
lib/tax/             calculation engine (server-side only)
lib/tax/rules/       versioned 2025/26 and 2026/27 rule sets
lib/schemas/         Zod API request/response schemas
lib/api/             (planned) CORS, errors, rate limiting
lib/openapi/         (planned) OpenAPI document builder
tests/               27 engine unit tests
```

## Deploy

No environment variables or database required. Deploy to Vercel:

```bash
vercel
```

or push to a connected Git repo — `pnpm build` is the build command and
`pnpm start` serves production on port 3015.
