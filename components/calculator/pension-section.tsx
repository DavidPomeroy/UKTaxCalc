"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Scenario } from "@/lib/calculator/scenario";

export function PensionSection({
  scenario,
  onChange,
}: {
  scenario: Scenario;
  onChange: (next: Scenario) => void;
}) {
  const pensionOn = scenario.pension?.method !== "none";

  const setPension = (patch: Partial<NonNullable<Scenario["pension"]>>) =>
    onChange({
      ...scenario,
      pension: {
        method: scenario.pension?.method ?? "net-pay",
        employeePercent: scenario.pension?.employeePercent ?? 5,
        employerPercent: scenario.pension?.employerPercent ?? 3,
        basis: "qualifying-earnings",
        ...patch,
      },
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="pension-toggle">Workplace pension</Label>
        <Switch
          id="pension-toggle"
          checked={pensionOn}
          onCheckedChange={(on) =>
            setPension({ method: on ? "net-pay" : "none" })
          }
        />
      </div>
      {pensionOn && (
        <div className="space-y-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="pensionMethod">Contribution method</Label>
            <Select
              value={scenario.pension?.method ?? "net-pay"}
              onValueChange={(v) =>
                setPension({
                  method: v as NonNullable<Scenario["pension"]>["method"],
                })
              }
            >
              <SelectTrigger id="pensionMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="net-pay">Net pay (before tax)</SelectItem>
                <SelectItem value="salary-sacrifice">Salary sacrifice</SelectItem>
                <SelectItem value="relief-at-source">Relief at source</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pensionEmployee">You (%)</Label>
              <Input
                id="pensionEmployee"
                inputMode="decimal"
                value={scenario.pension?.employeePercent ?? 5}
                onChange={(e) =>
                  setPension({
                    employeePercent: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0)
                    ),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pensionEmployer">Employer (%)</Label>
              <Input
                id="pensionEmployer"
                inputMode="decimal"
                value={scenario.pension?.employerPercent ?? 3}
                onChange={(e) =>
                  setPension({
                    employerPercent: Math.min(
                      100,
                      Math.max(0, Number(e.target.value) || 0)
                    ),
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
