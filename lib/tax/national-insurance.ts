import { clamp, positive, roundPence, toPence } from "./money";
import type { CalculationInput, NIResult, BandResult } from "./types";
import { getRules } from "./rules";

function bandedContribution(
  niablePayPence: number,
  primaryThreshold: number,
  upperEarningsLimit: number,
  mainRate: number,
  upperRate: number
): { total: number; bands: BandResult[] } {
  const pt = toPence(primaryThreshold);
  const uel = toPence(upperEarningsLimit);

  let remaining = positive(niablePayPence - pt);
  let total = 0;
  const bands: BandResult[] = [];

  // Main rate band: PT to UEL
  const mainAmount = clamp(remaining, 0, uel - pt);
  const mainTax = roundPence(mainAmount * mainRate);
  total += mainTax;
  bands.push({ name: "main", rate: mainRate, amount: mainAmount, tax: mainTax });
  remaining -= mainAmount;

  // Upper rate band: above UEL
  const upperAmount = positive(remaining);
  const upperTax = roundPence(upperAmount * upperRate);
  total += upperTax;
  bands.push({ name: "upper", rate: upperRate, amount: upperAmount, tax: upperTax });

  return { total, bands };
}

export function calculateEmployeeNI(
  input: CalculationInput,
  niablePayPence: number
): NIResult {
  const rules = getRules(input.taxYear).nationalInsurance;
  const { total, bands } = bandedContribution(
    niablePayPence,
    rules.primaryThreshold,
    rules.upperEarningsLimit,
    rules.mainRate,
    rules.upperRate
  );
  return { total, bands };
}

export function calculateEmployerNI(
  input: CalculationInput,
  niablePayPence: number
): { ni: number; employmentAllowanceBenefit: number } {
  const rules = getRules(input.taxYear);
  const st = toPence(rules.employerNationalInsurance.secondaryThreshold);
  const niable = positive(niablePayPence - st);
  let ni = roundPence(niable * rules.employerNationalInsurance.rate);

  let benefit = 0;
  if (input.employmentAllowance) {
    benefit = Math.min(ni, toPence(rules.employmentAllowance));
    ni -= benefit;
  }

  return { ni, employmentAllowanceBenefit: benefit };
}
