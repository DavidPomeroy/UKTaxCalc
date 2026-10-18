import { headers } from "next/headers";
import { calculate } from "@/lib/tax/calculate";
import { calculatePayrollPeriod } from "@/lib/tax/pay-period";
import {
  scenarioFromSearchParams,
  type SearchParams,
} from "@/lib/calculator/scenario";
import { SalaryForm } from "@/components/calculator/salary-form";
import { PayrollPanel } from "@/components/calculator/payroll-panel";
import { ResultsHero } from "@/components/calculator/results-hero";
import {
  BreakdownTable,
  DeductionsTable,
} from "@/components/calculator/breakdown-tables";
import { DeductionsChart } from "@/components/calculator/deductions-chart";
import { EmployerCard } from "@/components/calculator/employer-card";
import { ShareCard } from "@/components/calculator/share-card";
import { ApiCard } from "@/components/calculator/api-card";
import { AssumptionsCard } from "@/components/calculator/assumptions-card";

/** Fully dynamic: every request reads searchParams and runs the engine. */
export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const scenario = scenarioFromSearchParams(await searchParams);
  const result = calculate(scenario);
  const frequency = scenario.payFrequency ?? "annual";

  // Payroll view: per-period figures with HMRC per-period thresholds and
  // cumulative (or month 1) PAYE.
  const payroll =
    frequency === "monthly" || frequency === "weekly"
      ? calculatePayrollPeriod(scenario, {
          frequency,
          periodNumber: scenario.periodNumber ?? 1,
          taxBasis: scenario.taxBasis,
        })
      : null;

  // Server-side origin for the copyable curl example. Using request headers
  // avoids a `typeof window` branch, which caused a hydration mismatch.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3015";
  const proto =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const origin = `${proto}://${host}`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          UK take-home pay calculator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Income tax, National Insurance, student loans and pensions for{" "}
          {result.meta.taxYear} — calculated on the server, explained
          band by band.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <SalaryForm initial={scenario} />
        </div>

        <div className="space-y-6" aria-live="polite">
          {payroll && <PayrollPanel payroll={payroll} />}
          <ResultsHero result={result} scenario={scenario} />
          <div className="grid gap-6 md:grid-cols-2">
            <DeductionsChart result={result} frequency={frequency} />
            <EmployerCard result={result} frequency={frequency} />
          </div>
          <BreakdownTable result={result} frequency={frequency} />
          <DeductionsTable result={result} frequency={frequency} />
          <div className="grid gap-6 md:grid-cols-2">
            <ShareCard scenario={scenario} />
            <ApiCard scenario={scenario} origin={origin} />
          </div>
          <AssumptionsCard />
        </div>
      </div>
    </main>
  );
}

