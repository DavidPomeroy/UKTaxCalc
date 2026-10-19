import { clamp, positive, roundPence, toPence } from "./money";
import type {
  CalculationInput,
  IncomeTaxResult,
  BandResult,
  TaxBand,
  TaxYear,
} from "./types";
import { getBands, getRules } from "./rules";

/** Parse a PAYE tax code into a personal allowance in pounds.
 *
 * Supported codes:
 *   - Numeric + L/M/W suffix, 1 to 4 digits: number × 10 = allowance
 *     (e.g. "1257L" -> £12,570, "99L" -> £990, "0L" -> £0)
 *   - Optional S/C regional prefix (e.g. "S99L", "C1257L")
 *   - "BR": basic rate on all income (allowance 0)
 *   - "D0": higher rate on all (allowance 0)
 *   - "D1": additional rate on all (allowance 0)
 *   - "NT": no tax (allowance Infinity)
 *   - "0T": no allowance, bands still apply
 * Trailing emergency suffixes (e.g. "1257L M1") are ignored.
 * Unknown codes fall back to the standard Personal Allowance.
 */
export function parseTaxCode(
  taxCode: string | undefined,
  defaultAllowance: number
): number {
  const code = (taxCode || "").trim().toUpperCase();
  if (!code) return defaultAllowance;

  // Strip emergency code suffixes: "1257L M1", "1257LM1", "D0 W1", etc.
  const normalized = code.replace(/\s*[MW]1$/, "");

  if (
    normalized === "BR" ||
    normalized === "D0" ||
    normalized === "D1" ||
    normalized === "0T"
  )
    return 0;
  if (normalized === "NT") return Infinity;

  // Numeric codes: 1–4 digits + L/M/W suffix, optionally S/C prefixed.
  // Codes below 100 (0L–99L) are valid and parse to digits × 10.
  const match = normalized.match(/^([SC]?)(\d{1,4})[LMW]$/);
  if (match) return parseInt(match[2], 10) * 10;

  return defaultAllowance;
}

function applyTaper(
  personalAllowance: number,
  adjustedNetIncome: number,
  taperThreshold: number,
  divisor: number
): number {
  if (adjustedNetIncome <= taperThreshold) return personalAllowance;
  const excess = adjustedNetIncome - taperThreshold;
  const reduction = Math.floor(excess / divisor); // £1 lost per £2 over
  return Math.max(0, personalAllowance - reduction);
}

function bandedTax(
  taxableIncomePence: number,
  bands: TaxBand[]
): { total: number; bands: BandResult[] } {
  let remaining = taxableIncomePence;
  let total = 0;
  const results: BandResult[] = [];

  for (const band of bands) {
    if (remaining <= 0) break;
    // Bounds are cumulative taxable-income boundaries: the band is
    // (upper − lower) wide, so a band ending at £37,700 holds exactly
    // £37,700 of taxable income.
    const width =
      band.upper === Infinity
        ? remaining
        : toPence(band.upper) - toPence(band.lower);
    const amountInBand = clamp(remaining, 0, width);
    const tax = roundPence(amountInBand * band.rate);
    total += tax;
    results.push({
      name: band.name,
      rate: band.rate,
      amount: amountInBand,
      tax,
    });
    remaining -= amountInBand;
  }

  return { total, bands: results };
}

/** Rate of the band into which the next £1 of taxable income would fall. */
function bandIndexAt(
  taxableIncomePence: number,
  bands: TaxBand[]
): number {
  let remaining = taxableIncomePence;
  for (let i = 0; i < bands.length; i++) {
    const band = bands[i];
    if (remaining <= 0) return i;
    const width =
      band.upper === Infinity
        ? remaining
        : toPence(band.upper) - toPence(band.lower);
    const amountInBand = clamp(remaining, 0, width);
    remaining -= amountInBand;
    if (remaining <= 0) return i;
  }
  return bands.length - 1;
}

export function calculateIncomeTax(
  input: CalculationInput,
  taxablePayPence: number,
  adjustedNetIncomePence: number
): IncomeTaxResult {
  const ruleSet = getRules(input.taxYear as TaxYear);
  const taxBands = getBands(input.taxYear as TaxYear, input.region);

  // Base personal allowance from tax code or default
  const basePA = parseTaxCode(input.taxCode, ruleSet.personalAllowance);
  const basePAPence = basePA === Infinity ? Infinity : toPence(basePA);

  // Taper applies to the standard £12,570 allowance (and custom allowances
  // derived from it). A tax code that zeroes the allowance bypasses taper.
  let personalAllowancePence: number;
  if (basePAPence === Infinity) {
    personalAllowancePence = Infinity;
  } else {
    personalAllowancePence = applyTaper(
      basePAPence,
      adjustedNetIncomePence,
      toPence(ruleSet.paTaperThreshold),
      ruleSet.paTaperDivisor
    );
  }

  // Additional allowances / transfers
  let allowanceAdditionsPence = 0;
  if (input.blindPersonsAllowance) {
    allowanceAdditionsPence += toPence(ruleSet.blindPersonsAllowance);
  }
  if (input.marriageAllowanceReceive) {
    allowanceAdditionsPence += toPence(ruleSet.marriageAllowanceTransfer);
  }
  if (input.marriageAllowanceTransfer) {
    allowanceAdditionsPence -= toPence(ruleSet.marriageAllowanceTransfer);
  }

  // Custom allowance override
  if (input.customPersonalAllowance !== undefined) {
    personalAllowancePence = toPence(input.customPersonalAllowance);
  }

  // Total allowance, floored at 0, capped at taxable income
  let totalAllowancePence =
    personalAllowancePence === Infinity
      ? Infinity
      : personalAllowancePence + allowanceAdditionsPence;
  totalAllowancePence = Math.max(0, totalAllowancePence);

  const taxableIncomePence =
    totalAllowancePence === Infinity
      ? 0
      : positive(taxablePayPence - Math.min(totalAllowancePence, taxablePayPence));

  const { total, bands: bandResults } = bandedTax(taxableIncomePence, taxBands);

  // Marginal rate = rate of the band into which the next £1 of taxable
  // income would fall. No taxable income → no marginal rate.
  const marginalRate =
    bandResults.length === 0
      ? 0
      : bandResults[bandIndexAt(taxableIncomePence, taxBands)].rate;

  return {
    total,
    personalAllowance:
      totalAllowancePence === Infinity ? 0 : totalAllowancePence,
    taxableIncome: taxableIncomePence,
    bands: bandResults,
    marginalRate,
  };
}
