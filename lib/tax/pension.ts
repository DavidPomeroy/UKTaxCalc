import { clamp, roundPence, toPence } from "./money";
import type {
  CalculationInput,
  PensionResult,
  PensionBasis,
} from "./types";
import { getRules } from "./rules";

function contributionAmount(
  payPence: number,
  percent: number,
  basis: PensionBasis,
  qualifyingLowerPounds: number,
  qualifyingUpperPounds: number
): number {
  if (basis === "qualifying-earnings") {
    // Qualifying earnings = pay above the lower limit, capped at the upper
    // limit: QE = clamp(pay − LEL, 0, UEL − LEL).
    const lowerPence = toPence(qualifyingLowerPounds);
    const qe = clamp(
      payPence - lowerPence,
      0,
      toPence(qualifyingUpperPounds) - lowerPence
    );
    return roundPence(qe * (percent / 100));
  }
  return roundPence(payPence * (percent / 100));
}

export function calculatePension(
  input: CalculationInput,
  grossPence: number,
  payAfterSacrificePence: number
): PensionResult {
  const none: PensionResult = {
    employee: 0,
    employer: 0,
    salarySacrifice: 0,
    grossContribution: 0,
    method: "none",
  };

  const rules = getRules(input.taxYear).pension;
  const pension = input.pension;

  if (!pension || pension.method === "none") {
    return none;
  }

  const { method, employeePercent, employerPercent, basis } = pension;

  // Contributions are based on post-salary-sacrifice pay: the employee never
  // receives the sacrificed amount, so it cannot be contributed either.
  const contributionBasePence = payAfterSacrificePence;

  let employeePence = 0;
  let employerPence = 0;
  let sacrificePence = 0;
  let grossContribution = 0;

  if (method === "salary-sacrifice") {
    // The salary-sacrifice amount is a pre-tax pay reduction, NOT a deduction
    // from take-home. HMRC convention: employer (plus optional employee top-up)
    // pays the resulting pension.
    sacrificePence = roundPence(
      grossPence * (employeePercent / 100)
    );
    employerPence = contributionAmount(
      contributionBasePence,
      employerPercent,
      basis,
      rules.qualifyingEarningsLower,
      rules.qualifyingEarningsUpper
    );
    grossContribution = sacrificePence + employerPence;
  } else if (method === "net-pay") {
    // Deducted from pay before income tax is applied.
    employeePence = contributionAmount(
      contributionBasePence,
      employeePercent,
      basis,
      rules.qualifyingEarningsLower,
      rules.qualifyingEarningsUpper
    );
    employerPence = contributionAmount(
      contributionBasePence,
      employerPercent,
      basis,
      rules.qualifyingEarningsLower,
      rules.qualifyingEarningsUpper
    );
    grossContribution = employeePence + employerPence;
  } else if (method === "relief-at-source") {
    // Deducted from net pay; provider claims 20% basic-rate relief on top.
    // Employee's take-home bears the full contribution amount.
    employeePence = contributionAmount(
      contributionBasePence,
      employeePercent,
      basis,
      rules.qualifyingEarningsLower,
      rules.qualifyingEarningsUpper
    );
    employerPence = contributionAmount(
      contributionBasePence,
      employerPercent,
      basis,
      rules.qualifyingEarningsLower,
      rules.qualifyingEarningsUpper
    );
    grossContribution = roundPence(employeePence / 0.8) + employerPence;
  }

  return {
    employee: employeePence,
    employer: employerPence,
    salarySacrifice: sacrificePence,
    grossContribution,
    method,
  };
}
