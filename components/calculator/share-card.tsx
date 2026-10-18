"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Scenario } from "@/lib/calculator/scenario";
import { scenarioToSearchParams } from "@/lib/calculator/scenario";

export function ShareCard({ scenario }: { scenario: Scenario }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    const params = scenarioToSearchParams(scenario);
    const url = `${window.location.origin}/?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share this scenario</CardTitle>
        <CardDescription>
          The link encodes your inputs — nothing is stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" onClick={copy}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copy share link
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
