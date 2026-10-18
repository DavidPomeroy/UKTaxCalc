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
import { formatGBP } from "@/lib/calculator/scenario";

const COLORS = ["#16a34a", "#dc2626", "#ea580c", "#7c3aed", "#0d9488"];

interface Slice {
  name: string;
  value: number;
}

export function DeductionsChart({ result }: { result: CalculationResult }) {
  const slices: Slice[] = [
    { name: "Take home", value: result.takeHome.annual / 100 },
  ];
  if (result.incomeTax.total > 0)
    slices.push({ name: "Income tax", value: result.incomeTax.total / 100 });
  if (result.nationalInsurance.total > 0)
    slices.push({ name: "Employee NI", value: result.nationalInsurance.total / 100 });
  if (result.studentLoan.total > 0)
    slices.push({ name: "Student loan", value: result.studentLoan.total / 100 });
  const pensionOut = result.pension.employee + result.pension.salarySacrifice;
  if (pensionOut > 0)
    slices.push({ name: "Pension", value: pensionOut / 100 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where your pay goes</CardTitle>
        <CardDescription>Annual split of gross pay.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
              >
                {slices.map((s, i) => (
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
                {formatGBP(Math.round(s.value * 100))}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
