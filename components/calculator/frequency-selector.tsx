"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  PERIOD_LABELS,
  PAY_FREQUENCIES,
  scenarioToSearchParams,
  type PayFrequency,
  type Scenario,
  type TaxBasis,
} from "@/lib/calculator/scenario";

const FREQUENCY_LABELS: Record<PayFrequency, string> = {
  annual: "Annual estimate",
  monthly: "Monthly payslip",
  weekly: "Weekly payslip",
};

/** Pay-period controls: chooses the calculation basis (annual estimate vs
 * payroll period) and, for payroll, the period number and PAYE basis. These
 * own the `freq`, `period` and `basis` URL params. */
export function FrequencySelector({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const pathname = usePathname();
  const frequency = scenario.payFrequency ?? "annual";
  const isPayroll = frequency === "monthly" || frequency === "weekly";
  const periods = frequency === "weekly" ? 52 : 12;
  const periodNumber = scenario.periodNumber ?? 1;
  const taxBasis = scenario.taxBasis ?? "cumulative";

  const apply = (patch: Partial<Scenario>) => {
    const next: Scenario = {
      ...scenario,
      // Keep payroll options coherent whenever the frequency changes.
      periodNumber: scenario.periodNumber ?? 1,
      taxBasis: scenario.taxBasis ?? "cumulative",
      ...patch,
    };
    if (next.payFrequency === "annual") {
      next.periodNumber = undefined;
      next.taxBasis = undefined;
    }
    const params = scenarioToSearchParams(next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-3">
      <Tabs
        value={frequency}
        onValueChange={(v) => apply({ payFrequency: v as PayFrequency })}
        className="w-fit"
      >
        <TabsList aria-label="Calculation basis">
          {PAY_FREQUENCIES.map((freq) => (
            <TabsTrigger key={freq} value={freq}>
              {FREQUENCY_LABELS[freq]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPayroll && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="periodNumber">
              {PERIOD_LABELS[frequency as PayFrequency]}
            </Label>
            <Select
              value={String(periodNumber)}
              onValueChange={(v) => apply({ periodNumber: Number(v) })}
            >
              <SelectTrigger id="periodNumber">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: periods }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxBasis">PAYE basis</Label>
            <Select
              value={taxBasis}
              onValueChange={(v) => apply({ taxBasis: v as TaxBasis })}
            >
              <SelectTrigger id="taxBasis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cumulative">Cumulative</SelectItem>
                <SelectItem value="month1">
                  {frequency === "weekly" ? "Week 1" : "Month 1"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

