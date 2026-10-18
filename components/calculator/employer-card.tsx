import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CalculationResult } from "@/lib/tax/types";
import {
  PERIOD_NOUNS,
  formatPeriodGBP,
  type PayFrequency,
} from "@/lib/calculator/scenario";

export function EmployerCard({
  result,
  frequency,
}: {
  result: CalculationResult;
  frequency: PayFrequency;
}) {
  const label = PERIOD_NOUNS[frequency];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employer cost</CardTitle>
        <CardDescription>
          What employing you costs per {label} — on top of your gross pay.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gross pay</span>
          <span className="font-mono tabular-nums">
            {formatPeriodGBP(result.gross.annual, frequency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Employer NI (15%)</span>
          <span className="font-mono tabular-nums">
            {formatPeriodGBP(result.employer.ni, frequency)}
          </span>
        </div>
        {result.employer.employmentAllowanceBenefit > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Employment Allowance</span>
            <span className="font-mono tabular-nums">
              −{formatPeriodGBP(result.employer.employmentAllowanceBenefit, frequency)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Employer pension</span>
          <span className="font-mono tabular-nums">
            {formatPeriodGBP(result.employer.pension, frequency)}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total cost</span>
          <span className="font-mono tabular-nums">
            {formatPeriodGBP(result.employer.totalCost, frequency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
