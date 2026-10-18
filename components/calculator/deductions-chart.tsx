"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CalculationResult } from "@/lib/tax/types";
import {
  PERIOD_LABELS,
  formatGBP,
  formatPeriodGBP,
  perPeriodPence,
  type PayFrequency,
} from "@/lib/calculator/scenario";

const COLORS = ["#16a34a", "#dc2626", "#ea580c", "#7c3aed", "#0d9488"];

interface Slice {
  name: string;
  pence: number;
}

export function DeductionsChart({
  result,
  frequency,
}: {
  result: CalculationResult;
  frequency: PayFrequency;
}) {
  const slices: Slice[] = [{ name: "Take home", pence: result.takeHome.annual }];
  if (result.incomeTax.total > 0)
    slices.push({ name: "Income tax", pence: result.incomeTax.total });
  if (result.nationalInsurance.total > 0)
    slices.push({ name: "Employee NI", pence: result.nationalInsurance.total });
  if (result.studentLoan.total > 0)
    slices.push({ name: "Student loan", pence: result.studentLoan.total });
  const pensionOut = result.pension.employee + result.pension.salarySacrifice;
  if (pensionOut > 0) slices.push({ name: "Pension", pence: pensionOut });

  const data = slices.map((s) => ({
    name: s.name,
    value: perPeriodPence(s.pence, frequency) / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where your pay goes</CardTitle>
        <CardDescription>
          {PERIOD_LABELS[frequency]} split of gross pay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
              >
                {data.map((s, i) => (
                  <Cell key={s.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  formatGBP(Math.round(Number(value ?? 0) * 100))
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {slices.map((s, i) => (
            <li key={s.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {s.name}
              </span>
              <span className="font-mono tabular-nums">
                {formatPeriodGBP(s.pence, frequency)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
