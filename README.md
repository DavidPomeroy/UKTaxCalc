# UK Tax Calculator

A UK take-home pay calculator built with **Next.js 16**, **shadcn/ui** and
TypeScript. All calculations run on the server against versioned,
GOV.UK-verified tax rules — no database, no accounts, no stored data.

**Live:** <https://uk-tax-calc-six.vercel.app> ·
**API reference:** <https://uk-tax-calc-six.vercel.app/scalar>

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
- **Payroll-accurate pay periods** — monthly/weekly figures using HMRC's
  per-period thresholds and cumulative PAYE, with year-to-date totals for
  reconciling a real payslip

## Current status

Implemented and tested:

- `lib/tax/` — the calculation engine (integer-pence arithmetic)
- `lib/tax/rules/` — versioned 2025/26 and 2026/27 rule sets
- `tests/` — 87 unit tests, all passing (`pnpm test`)
- `lib/schemas/calculation.ts` — Zod request/response schemas for the API
- `app/` — the calculator UI (server-rendered results, shareable URLs)
- `app/api/v1/` — the public API (`/api/v1/calculations`, `/take-home-pay`,
  `/tax-years`, `/tax-years/:year/rates`, `/health`)
- `/openapi.json` — OpenAPI 3.1 document
- `/scalar` — interactive API reference

## Getting started

Requirements: Node.js ≥ 20, [pnpm](https://pnpm.io) 10.

```bash
pnpm install
pnpm dev      # starts on http://localhost:3015
```

Other scripts:

```bash
pnpm test        # run the 87 unit tests (vitest)
pnpm test:watch  # watch mode
pnpm typecheck   # tsc --noEmit
pnpm lint
pnpm build
pnpm start       # production server, also on :3015
```

## Using the UI

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
6. **Advanced** — PAYE tax code (e.g. `1257L`, `99L`, `BR`, `D0`, `NT`),
   Blind Person's Allowance, Marriage Allowance transfer/receive.
7. **Pay period** — choose **Annual estimate**, **Monthly payslip** or
   **Weekly payslip**. Every figure is re-based on that selection; in the
   payslip modes you also pick the **period number** (1–12 or 1–52) and the
   **PAYE basis** (Cumulative or Month 1 / Week 1), and a **Payslip view**
   panel shows this period alongside year-to-date totals.

Results show the selected-period take-home pay with the other periods for
reference, an itemised band-by-band breakdown, effective and marginal
rates, employer cost, and a link that copies the current scenario as a
shareable URL (inputs live in the query string — nothing is stored
server-side). The API card shows a ready-to-run `curl` for the exact
scenario on screen.

Example shareable URL:

```text
http://localhost:3015/?salary=60000&region=scotland&taxYear=2026%2F27&loans=plan2&freq=monthly
```

## Using the API

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
`payFrequency`, `periodNumber`, `taxBasis`, `pension`, `studentLoans`,
`taxCode`, `customPersonalAllowance`, `blindPersonsAllowance`,
`marriageAllowanceTransfer`, `marriageAllowanceReceive`,
`niCategoryLetter`, `employmentAllowance`.

### Example: payroll period (reconcile a payslip)

```bash
curl -s http://localhost:3015/api/v1/calculations \
  -H 'content-type: application/json' \
  -d '{
    "taxYear": "2026/27",
    "region": "england",
    "grossAnnualSalary": 45000,
    "payFrequency": "monthly",
    "periodNumber": 6,
    "taxBasis": "cumulative",
    "taxCode": "432L",
    "pension": {
      "method": "relief-at-source",
      "employeePercent": 4,
      "employerPercent": 3,
      "basis": "qualifying-earnings"
    }
  }' | jq '.payroll.thisPeriod, .payroll.yearToDate'
```

Setting `payFrequency` to `monthly` or `weekly` adds a `payroll` block with
`thisPeriod` and `yearToDate` figures for gross pay, income tax, employee
and employer NI, pension, student loans and net pay, calculated with
HMRC's per-period thresholds and cumulative PAYE.

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
- NI and student loans use annualised thresholds in the annual estimate;
  the monthly/weekly payroll view uses HMRC's separate per-period
  thresholds instead (they are not simply annual ÷ periods).
- Student loan deductions in the payroll view are rounded down to whole
  pounds per period, as HMRC requires.
- Relief-at-source pensions include basic-rate relief only; higher-rate
  relief via self-assessment is not modelled.
- Payroll tax is calculated cumulatively across the tax year by default
  (Month 1 / Week 1 available). A specific payroll product can still differ
  by pennies because of its own table rounding or an in-year tax code
  change — NI, employer NI and pension figures should match exactly.
- Rounding is to the nearest penny per component, so totals may differ
  from payroll software by a few pence.

**Estimates only — not financial or tax advice.**

## Project structure

```text
app/                 Next.js App Router (UI + API routes)
components/calculator/  form, results, charts, frequency selector
components/ui/       shadcn/ui primitives (hand-installed)
lib/tax/             calculation engine (server-side only)
lib/tax/rules/       versioned 2025/26 and 2026/27 rule sets
lib/schemas/         Zod API request/response schemas
lib/api/             CORS, RFC 9457 errors, rate limiting, serialization
lib/openapi/         OpenAPI document builder (zod-openapi)
lib/calculator/      URL scenario + per-period formatting helpers
tests/               87 unit tests (engine and scenario layer)
```

## Deploy

No environment variables or database required. It is deployed on Vercel at
<https://uk-tax-calc-six.vercel.app>, connected to this repository's `main`
branch, so a push to `main` deploys automatically and other branches get
preview deployments.

To deploy it yourself:

```bash
vercel
```

or push to a connected Git repo — `pnpm build` is the build command and
`pnpm start` serves production on port 3015.
