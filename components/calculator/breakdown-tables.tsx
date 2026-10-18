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
import { formatGBP, formatPercent } from "@/lib/calculator/scenario";

function bandName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function BreakdownTable({ result }: { result: CalculationResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income tax breakdown</CardTitle>
        <CardDescription>
          Personal allowance {formatGBP(result.incomeTax.personalAllowance)} ·{" "}
          taxable income {formatGBP(result.incomeTax.taxableIncome)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Band</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">In band</TableHead>
              <TableHead className="text-right">Tax</TableHead>
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
                  {formatGBP(b.amount)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatGBP(b.tax)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right font-mono tabular-nums">
                {formatGBP(result.incomeTax.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function DeductionsTable({ result }: { result: CalculationResult }) {
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
        <CardDescription>What leaves your pay, and where it goes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deduction</TableHead>
              <TableHead className="text-right">Annual</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
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
                  {formatGBP(annual)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatGBP(Math.round(annual / 12))}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total deductions</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatGBP(result.deductionsTotal)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatGBP(Math.round(result.deductionsTotal / 12))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
