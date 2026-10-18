import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PayrollPeriodResult } from "@/lib/tax/pay-period";
import { PERIOD_LABELS, formatGBP } from "@/lib/calculator/scenario";

/** Payroll (per pay period) view: this period alongside year to date, using
 * HMRC's per-period thresholds and cumulative PAYE. */
export function PayrollPanel({ payroll }: { payroll: PayrollPeriodResult }) {
  const unit = PERIOD_LABELS[payroll.frequency].toLowerCase();
  const { thisPeriod, yearToDate } = payroll;

  const rows: Array<[string, number, number, string?]> = [
    ["Gross pay", thisPeriod.gross, yearToDate.gross],
  ];
  if (thisPeriod.salarySacrifice > 0) {
    rows.push([
      "Salary sacrifice",
      thisPeriod.salarySacrifice,
      yearToDate.salarySacrifice,
      "Given up pre-tax",
    ]);
  }
  rows.push(
    ["Income tax", thisPeriod.incomeTax, yearToDate.incomeTax],
    ["Employee NI", thisPeriod.employeeNi, yearToDate.employeeNi],
    ["Employer NI", thisPeriod.employerNi, yearToDate.employerNi],
    [
      "Pension (you)",
      thisPeriod.pensionEmployee,
      yearToDate.pensionEmployee,
      "Deducted from net pay",
    ],
    ["Pension (employer)", thisPeriod.pensionEmployer, yearToDate.pensionEmployer]
  );
  if (thisPeriod.studentLoan > 0) {
    rows.push([
      "Student loan",
      thisPeriod.studentLoan,
      yearToDate.studentLoan,
      "Rounded down to whole pounds",
    ]);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Payslip view</CardTitle>
          <Badge variant="secondary">
            {PERIOD_LABELS[payroll.frequency]} {payroll.periodNumber} of{" "}
            {payroll.periodsPerYear}
          </Badge>
          <Badge variant="outline">
            {payroll.taxBasis === "cumulative" ? "Cumulative" : "Month 1"} basis
          </Badge>
        </div>
        <CardDescription>
          Payroll-accurate figures using HMRC&apos;s per-{unit} NI, employer NI,
          pension and student loan thresholds, with PAYE on a{" "}
          {payroll.taxBasis === "cumulative" ? "cumulative" : "Month 1"} basis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">This {unit}</TableHead>
              <TableHead className="text-right">Year to date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([label, period, ytd, note]) => (
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
                  {formatGBP(period)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatGBP(ytd)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Net pay</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatGBP(thisPeriod.net)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatGBP(yearToDate.net)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
