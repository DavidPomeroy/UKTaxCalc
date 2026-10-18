import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SOURCES: Array<[string, string]> = [
  ["Income tax rates", "https://www.gov.uk/income-tax-rates"],
  ["Scottish income tax", "https://www.gov.uk/scottish-income-tax"],
  ["Welsh income tax", "https://www.gov.uk/welsh-income-tax"],
  ["National Insurance", "https://www.gov.uk/national-insurance-rates-letters"],
  ["Student loan repayments", "https://www.gov.uk/repaying-your-student-loan/what-you-pay"],
  ["Workplace pensions", "https://www.gov.uk/workplace-pensions"],
];

export function AssumptionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assumptions & sources</CardTitle>
        <CardDescription>What this calculator does and doesn&apos;t do.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>PAYE employment income only — no self-employment, dividends, savings or rental income.</li>
          <li>NI and student loans use annualised thresholds and assume constant pay.</li>
          <li>Relief-at-source pensions include basic-rate relief only.</li>
          <li>Rounding is to the nearest penny per component.</li>
        </ul>
        <p className="font-semibold text-foreground">Sources (GOV.UK):</p>
        <ul className="list-disc space-y-1 pl-5">
          {SOURCES.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
