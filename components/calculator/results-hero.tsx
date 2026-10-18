import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalculationResult } from "@/lib/tax/types";
import {
  REGION_LABELS,
  formatGBP,
  formatPercent,
} from "@/lib/calculator/scenario";

export function ResultsHero({ result }: { result: CalculationResult }) {
  const { takeHome, gross } = result;
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary px-6 pb-6 pt-6 text-primary-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-primary-foreground">
            Take-home pay
          </CardTitle>
          <Badge variant="secondary">
            {result.meta.taxYear} · {REGION_LABELS[result.meta.region]}
          </Badge>
        </div>
        <CardDescription className="text-primary-foreground/70">
          {formatGBP(gross.annual, { decimals: 0 })} gross per year
        </CardDescription>
      </div>
      <CardContent className="pt-4">
        <Tabs defaultValue="annual">
          <TabsList aria-label="Pay period">
            <TabsTrigger value="annual">Annual</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          <TabsContent value="annual" className="pt-2">
            <p className="font-mono text-4xl font-bold tabular-nums" aria-live="polite">
              {formatGBP(takeHome.annual)}
            </p>
          </TabsContent>
          <TabsContent value="monthly" className="pt-2">
            <p className="font-mono text-4xl font-bold tabular-nums" aria-live="polite">
              {formatGBP(takeHome.monthly)}
            </p>
          </TabsContent>
          <TabsContent value="weekly" className="pt-2">
            <p className="font-mono text-4xl font-bold tabular-nums" aria-live="polite">
              {formatGBP(takeHome.weekly)}
            </p>
          </TabsContent>
        </Tabs>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Badge variant="outline">
            Effective rate {formatPercent(takeHome.effectiveRate)}
          </Badge>
          <Badge variant="outline">
            Marginal rate {formatPercent(takeHome.marginalRate)}
          </Badge>
          <Badge variant="outline">
            {formatGBP(result.deductionsTotal)} total deductions
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
