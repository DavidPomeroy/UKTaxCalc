"use client";

import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Scenario } from "@/lib/calculator/scenario";

function toApiBody(s: Scenario) {
  return {
    taxYear: s.taxYear,
    region: s.region,
    grossAnnualSalary: s.grossAnnualSalary,
    ...(s.pension && s.pension.method !== "none" ? { pension: s.pension } : {}),
    ...(s.studentLoans.length > 0 ? { studentLoans: s.studentLoans } : {}),
    ...(s.taxCode && s.taxCode !== "1257L" ? { taxCode: s.taxCode } : {}),
    ...(s.blindPersonsAllowance ? { blindPersonsAllowance: true } : {}),
    ...(s.marriageAllowanceTransfer ? { marriageAllowanceTransfer: true } : {}),
    ...(s.marriageAllowanceReceive ? { marriageAllowanceReceive: true } : {}),
    ...(s.employmentAllowance ? { employmentAllowance: true } : {}),
  };
}

export function ApiCard({
  scenario,
  origin,
}: {
  scenario: Scenario;
  origin: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const body = toApiBody(scenario);
  const curl = `curl -s ${origin}/api/v1/calculations \\
  -H 'content-type: application/json' \\
  -d '${JSON.stringify(body)}'`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(curl);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-4 w-4" /> Try the public API
        </CardTitle>
        <CardDescription>
          This page uses the same calculation the API serves. Copy the{" "}
          <span className="font-mono">curl</span> for your current scenario,
          or explore every endpoint in the{" "}
          <a href="/scalar" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            interactive docs
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
          {curl}
        </pre>
        <Button variant="outline" className="w-full" onClick={copy}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copy curl
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
