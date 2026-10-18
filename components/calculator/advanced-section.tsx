"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DEFAULT_SCENARIO,
  scenarioToSearchParams,
  type Scenario,
} from "@/lib/calculator/scenario";
import { usePathname, useRouter } from "next/navigation";

export function AdvancedSection({
  scenario,
  onChange,
}: {
  scenario: Scenario;
  onChange: (next: Scenario) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const update = (patch: Partial<Scenario>) =>
    onChange({ ...scenario, ...patch });

  return (
    <>
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced options</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="taxCode">PAYE tax code</Label>
                <Input
                  id="taxCode"
                  className="font-mono uppercase"
                  value={scenario.taxCode ?? "1257L"}
                  onChange={(e) => update({ taxCode: e.target.value || "1257L" })}
                />
                <p className="text-xs text-muted-foreground">
                  e.g. 1257L, BR, D0, NT. Unknown codes fall back to the
                  standard allowance.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={scenario.blindPersonsAllowance}
                  onCheckedChange={(v) =>
                    update({ blindPersonsAllowance: v === true })
                  }
                />
                Blind Person&apos;s Allowance
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={scenario.marriageAllowanceReceive}
                  onCheckedChange={(v) =>
                    update({ marriageAllowanceReceive: v === true })
                  }
                />
                Receive Marriage Allowance (£1,260)
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={scenario.marriageAllowanceTransfer}
                  onCheckedChange={(v) =>
                    update({ marriageAllowanceTransfer: v === true })
                  }
                />
                Transfer Marriage Allowance away (£1,260)
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={scenario.employmentAllowance}
                  onCheckedChange={(v) =>
                    update({ employmentAllowance: v === true })
                  }
                />
                Employment Allowance (employer NI)
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          onChange({ ...DEFAULT_SCENARIO });
          const params = scenarioToSearchParams(DEFAULT_SCENARIO);
          router.replace(params.toString() ? `/?${params}` : pathname, {
            scroll: false,
          });
        }}
      >
        Reset to defaults
      </Button>
    </>
  );
}
