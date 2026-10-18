import { positive, roundPence, toPence } from "./money";
import type { CalculationInput, StudentLoanResult } from "./types";
import { getRules } from "./rules";

export function calculateStudentLoan(
  input: CalculationInput,
  studentLoanablePayPence: number
): StudentLoanResult {
  const rules = getRules(input.taxYear).studentLoans;
  const plans: StudentLoanResult["plans"] = [];
  let total = 0;

  for (const plan of input.studentLoans) {
    const rule = rules[plan];
    if (!rule) continue;
    const amount = positive(studentLoanablePayPence - toPence(rule.threshold));
    const repayment = roundPence(amount * rule.rate);
    total += repayment;
    plans.push({
      plan,
      amount: repayment,
      threshold: toPence(rule.threshold),
      rate: rule.rate,
    });
  }

  return { total, plans };
}
