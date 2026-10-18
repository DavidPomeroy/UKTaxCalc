import { rules202627 } from "./2026-27";
import { rules202526 } from "./2025-26";
import type { TaxYear, Region, TaxBand } from "../types";

export const RULES = {
  "2026/27": rules202627,
  "2025/26": rules202526,
} as const;

export type RuleSet = (typeof RULES)[TaxYear];

export const SUPPORTED_TAX_YEARS: TaxYear[] = ["2026/27", "2025/26"];

export const CURRENT_TAX_YEAR: TaxYear = "2026/27";

export function getRules(taxYear: TaxYear): RuleSet {
  const rules = RULES[taxYear];
  if (!rules) {
    throw new Error(`Unsupported tax year: ${taxYear}`);
  }
  return rules;
}

export function getBands(taxYear: TaxYear, region: Region): TaxBand[] {
  return [...getRules(taxYear).incomeTax[region]];
}
