"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PERIOD_LABELS,
  PAY_FREQUENCIES,
  scenarioToSearchParams,
  type PayFrequency,
  type Scenario,
} from "@/lib/calculator/scenario";

/** Global annual/monthly/weekly selector. It owns the `freq` URL param and
 * re-bases every figure on the results side of the page. */
export function FrequencySelector({ scenario }: { scenario: Scenario }) {
  const router = useRouter();
  const pathname = usePathname();
  const frequency = scenario.payFrequency ?? "annual";

  const select = (freq: PayFrequency) => {
    const params = scenarioToSearchParams({ ...scenario, payFrequency: freq });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <Tabs
      value={frequency}
      onValueChange={(v) => select(v as PayFrequency)}
      className="w-fit"
    >
      <TabsList aria-label="Show results as">
        {PAY_FREQUENCIES.map((freq) => (
          <TabsTrigger key={freq} value={freq}>
            {PERIOD_LABELS[freq]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
