import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CalculationResult } from "@/lib/tax/types";
import {
  PERIOD_NOUNS,
  REGION_LABELS,
  formatGBP,
  formatPercent,
  formatPeriodGBP,
  type PayFrequency,
  type Scenario,
} from "@/lib/calculator/scenario";
import { FrequencySelector } from "./frequency-selector";

const OTHER_PERIODS: PayFrequency[] = ["annual", "monthly", "weekly"];

export function ResultsHero({
  result,
  scenario,
}: {
  result: CalculationResult;
  scenario: Scenario;
}) {
  const { takeHome, gross } = result;
  const frequency = scenario.payFrequency ?? "annual";
  const label = PERIOD_NOUNS[frequency];
  const others = OTHER_PERIODS.filter((f) => f !== frequency);

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary px-6 pb-6 pt-6 text-primary-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-primary-foreground">
            Take-home pay
          </CardTitle>
          <Badge variant="secondary">
            {result.meta.taxYear} · {REGION_LABELS[result.meta.region]}
          </Badge>
        </div>
        <CardDescription className="text-primary-foreground/70">
          {formatPeriodGBP(gross.annual, frequency, { decimals: 0 })} gross per{" "}
          {label} ({formatGBP(gross.annual, { decimals: 0 })} per year)
        </CardDescription>
      </div>
      <CardContent className="pt-4">
        <FrequencySelector scenario={scenario} />
        <p
          className="mt-3 font-mono text-4xl font-bold tabular-nums"
          aria-live="polite"
        >
          {formatPeriodGBP(takeHome.annual, frequency)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          per {label}
          {others.map((f) => (
            <span key={f}>
              {" · "}
              {formatPeriodGBP(takeHome.annual, f)} per {PERIOD_NOUNS[f]}
            </span>
          ))}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Badge variant="outline">
            Effective rate {formatPercent(takeHome.effectiveRate)}
          </Badge>
          <Badge variant="outline">
            Marginal rate {formatPercent(takeHome.marginalRate)}
          </Badge>
          <Badge variant="outline">
            {formatPeriodGBP(result.deductionsTotal, frequency)} deductions
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
