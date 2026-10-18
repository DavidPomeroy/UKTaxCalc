import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CalculationResult } from "@/lib/tax/types";
import { formatGBP } from "@/lib/calculator/scenario";

export function EmployerCard({ result }: { result: CalculationResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employer cost</CardTitle>
        <CardDescription>
          What employing you costs on top of your gross pay.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gross pay</span>
          <span className="font-mono tabular-nums">
            {formatGBP(result.gross.annual)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Employer NI (15%)</span>
          <span className="font-mono tabular-nums">
            {formatGBP(result.employer.ni)}
          </span>
        </div>
        {result.employer.employmentAllowanceBenefit > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
            <span>Employment Allowance</span>
            <span className="font-mono tabular-nums">
              −{formatGBP(result.employer.employmentAllowanceBenefit)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Employer pension</span>
          <span className="font-mono tabular-nums">
            {formatGBP(result.employer.pension)}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total cost</span>
          <span className="font-mono tabular-nums">
            {formatGBP(result.employer.totalCost)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
