import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CalculationResult } from "@/lib/tax/types";
import {
  PERIOD_LABELS,
  PERIOD_NOUNS,
  formatPercent,
  formatPeriodGBP,
  type PayFrequency,
} from "@/lib/calculator/scenario";

function bandName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function BreakdownTable({
  result,
  frequency,
}: {
  result: CalculationResult;
  frequency: PayFrequency;
}) {
  const suffix = frequency === "annual" ? "" : ` (${frequency})`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income tax breakdown</CardTitle>
        <CardDescription>
          Personal allowance {formatPeriodGBP(result.incomeTax.personalAllowance, frequency)} ·{" "}
          taxable income {formatPeriodGBP(result.incomeTax.taxableIncome, frequency)}
          {suffix}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Band</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">In band{suffix}</TableHead>
              <TableHead className="text-right">Tax{suffix}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.incomeTax.bands.map((b) => (
              <TableRow key={b.name}>
                <TableCell>{bandName(b.name)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatPercent(b.rate, 0)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatPeriodGBP(b.amount, frequency)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatPeriodGBP(b.tax, frequency)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right font-mono tabular-nums">
                {formatPeriodGBP(result.incomeTax.total, frequency)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function DeductionsTable({
  result,
  frequency,
}: {
  result: CalculationResult;
  frequency: PayFrequency;
}) {
  const rows: Array<[string, number, string?]> = [
    ["Income tax", result.incomeTax.total],
    ["Employee NI", result.nationalInsurance.total],
  ];
  if (result.studentLoan.total > 0) {
    const plans = result.studentLoan.plans.map((p) => p.plan).join(" + ");
    rows.push([`Student loan (${plans})`, result.studentLoan.total]);
  }
  if (result.pension.employee > 0) {
    rows.push([
      `Pension (${result.pension.method})`,
      result.pension.employee,
      "Deducted from take-home",
    ]);
  }
  if (result.pension.salarySacrifice > 0) {
    rows.push([
      "Salary sacrifice",
      result.pension.salarySacrifice,
      "Given up pre-tax",
    ]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All deductions</CardTitle>
        <CardDescription>
          What leaves your pay, per {PERIOD_NOUNS[frequency]}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deduction</TableHead>
              <TableHead className="text-right">
                {PERIOD_LABELS[frequency]}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([label, annual, note]) => (
              <TableRow key={label}>
                <TableCell>
                  {label}
                  {note && (
                    <span className="block text-xs text-muted-foreground">
                      {note}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatPeriodGBP(annual, frequency)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total deductions</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatPeriodGBP(result.deductionsTotal, frequency)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
