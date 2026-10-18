"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LOAN_LABELS,
  REGION_LABELS,
  scenarioToSearchParams,
  type Scenario,
} from "@/lib/calculator/scenario";
import type { StudentLoanPlan } from "@/lib/tax/types";
import { PensionSection } from "./pension-section";
import { AdvancedSection } from "./advanced-section";

const LOAN_PLANS: StudentLoanPlan[] = ["plan1", "plan2", "plan4", "plan5", "postgraduate"];

export function SalaryForm({ initial }: { initial: Scenario }) {
  const router = useRouter();
  const pathname = usePathname();
  const [scenario, setScenario] = React.useState<Scenario>(initial);
  const [salaryText, setSalaryText] = React.useState(String(initial.grossAnnualSalary));
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = React.useCallback(
    (next: Scenario) => {
      setScenario(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const params = scenarioToSearchParams(next);
        // `freq`, `period` and `basis` are owned by the pay-period controls
        // (not this form); carry the live values over so a stale local
        // snapshot can't reset the user's selection.
        const live = new URLSearchParams(window.location.search);
        for (const key of ["freq", "period", "basis"]) {
          const value = live.get(key);
          if (value) params.set(key, value);
          else params.delete(key);
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }, 250);
    },
    [pathname, router]
  );

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const update = (patch: Partial<Scenario>) => push({ ...scenario, ...patch });

  const commitSalary = (raw: string) => {
    setSalaryText(raw);
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(n)) {
      push({
        ...scenario,
        grossAnnualSalary: Math.min(10_000_000, Math.max(0, Math.round(n))),
      });
    }
  };

  const toggleLoan = (plan: StudentLoanPlan, on: boolean) => {
    update({
      studentLoans: on
        ? [...scenario.studentLoans, plan]
        : scenario.studentLoans.filter((l) => l !== plan),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
        <CardDescription>
          Everything recalculates on the server as you type.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="salary">Gross annual salary</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              £
            </span>
            <Input
              id="salary"
              inputMode="decimal"
              className="pl-7 font-mono"
              value={salaryText}
              onChange={(e) => commitSalary(e.target.value)}
            />
          </div>
          <Slider
            value={[Math.min(200000, scenario.grossAnnualSalary)]}
            max={200000}
            step={500}
            aria-label="Salary slider"
            onValueChange={([v]) => {
              setSalaryText(String(v));
              push({ ...scenario, grossAnnualSalary: v });
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>£0</span>
            <span>£200k</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxYear">Tax year</Label>
            <Select
              value={scenario.taxYear}
              onValueChange={(v) => update({ taxYear: v as Scenario["taxYear"] })}
            >
              <SelectTrigger id="taxYear">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026/27">2026/27</SelectItem>
                <SelectItem value="2025/26">2025/26</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Where you live</Label>
            <Select
              value={scenario.region}
              onValueChange={(v) => update({ region: v as Scenario["region"] })}
            >
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REGION_LABELS) as (keyof typeof REGION_LABELS)[]).map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {REGION_LABELS[r]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Student loan</Label>
          <div className="grid grid-cols-1 gap-2">
            {LOAN_PLANS.map((plan) => (
              <label
                key={plan}
                className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={scenario.studentLoans.includes(plan)}
                  onCheckedChange={(v) => toggleLoan(plan, v === true)}
                />
                {LOAN_LABELS[plan]}
              </label>
            ))}
          </div>
        </div>

        <PensionSection scenario={scenario} onChange={push} />
        <AdvancedSection scenario={scenario} onChange={push} />
      </CardContent>
    </Card>
  );
}
