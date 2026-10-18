import { describe, expect, it } from "vitest";
import { calculatePayrollPeriod } from "@/lib/tax/pay-period";
import { calculate } from "@/lib/tax/calculate";
import { toPence } from "@/lib/tax/money";

/** The real payslip: SME IT UK LTD, month ending 30 Sept 2026 (month 6). */
const PAYSLIP = {
  taxYear: "2026/27" as const,
  region: "england" as const,
  grossAnnualSalary: 45000,
  taxCode: "432L",
  pension: {
    method: "relief-at-source" as const,
    employeePercent: 4,
    employerPercent: 3,
    basis: "qualifying-earnings" as const,
  },
};

describe("payslip reconciliation — £3,750/month, 432L, NEST 4%/3%, month 6", () => {
  const r = calculatePayrollPeriod(PAYSLIP, {
    frequency: "monthly",
    periodNumber: 6,
  });

  it("gross pay is £3,750.00", () => {
    expect(r.thisPeriod.gross).toBe(toPence(3750));
  });

  it("employee NI matches the payslip exactly (£216.16)", () => {
    expect(r.thisPeriod.employeeNi).toBe(toPence(216.16));
  });

  it("employer NI matches exactly (£499.95)", () => {
    expect(r.thisPeriod.employerNi).toBe(toPence(499.95));
  });

  it("employee pension matches exactly (£129.20)", () => {
    expect(r.thisPeriod.pensionEmployee).toBe(toPence(129.2));
  });

  it("employer pension matches exactly (£96.90)", () => {
    expect(r.thisPeriod.pensionEmployer).toBe(toPence(96.9));
  });

  it("income tax is within 40p of the payslip (£727.27)", () => {
    expect(
      Math.abs(r.thisPeriod.incomeTax - toPence(727.27))
    ).toBeLessThanOrEqual(toPence(0.4));
  });

  it("net pay is within 50p of the amount paid (£2,677.37)", () => {
    expect(Math.abs(r.thisPeriod.net - toPence(2677.37))).toBeLessThanOrEqual(
      toPence(0.5)
    );
  });

  it("year-to-date NI, employer NI and pensions match exactly", () => {
    expect(r.yearToDate.gross).toBe(toPence(22500));
    expect(r.yearToDate.employeeNi).toBe(toPence(1296.96));
    expect(r.yearToDate.employerNi).toBe(toPence(2999.7));
    expect(r.yearToDate.pensionEmployee).toBe(toPence(775.2));
    expect(r.yearToDate.pensionEmployer).toBe(toPence(581.4));
  });

  it("year-to-date tax is within £2 of the payslip (£4,364.00)", () => {
    expect(
      Math.abs(r.yearToDate.incomeTax - toPence(4364))
    ).toBeLessThanOrEqual(toPence(2));
  });
});

describe("weekly payroll", () => {
  const w = calculatePayrollPeriod(PAYSLIP, {
    frequency: "weekly",
    periodNumber: 1,
  });

  it("uses weekly thresholds (£242/£967 NI, £96 ST, £120–£967 QE)", () => {
    expect(w.thisPeriod.gross).toBe(toPence(865.38));
    expect(w.thisPeriod.employeeNi).toBe(toPence(49.87));
    expect(w.thisPeriod.employerNi).toBe(toPence(115.41));
    expect(w.thisPeriod.pensionEmployee).toBe(toPence(29.82));
    expect(w.thisPeriod.pensionEmployer).toBe(toPence(22.36));
  });
});

describe("student loans are floored to whole pounds per period", () => {
  it("Plan 2 monthly: (3,750 − 2,448) × 9% = 117.18 → £117", () => {
    const r = calculatePayrollPeriod(
      { ...PAYSLIP, studentLoans: ["plan2"] },
      { frequency: "monthly", periodNumber: 1 }
    );
    expect(r.thisPeriod.studentLoan).toBe(toPence(117));
  });

  it("Plan 2 weekly: (865.38 − 565) × 9% = 27.03 → £27", () => {
    const r = calculatePayrollPeriod(
      { ...PAYSLIP, studentLoans: ["plan2"] },
      { frequency: "weekly", periodNumber: 1 }
    );
    expect(r.thisPeriod.studentLoan).toBe(toPence(27));
  });

  it("2025/26 uses that year's thresholds (Plan 2 monthly £2,372 → £124)", () => {
    const r = calculatePayrollPeriod(
      { ...PAYSLIP, taxYear: "2025/26", studentLoans: ["plan2"] },
      { frequency: "monthly", periodNumber: 1 }
    );
    expect(r.thisPeriod.studentLoan).toBe(toPence(124));
    // NI and pension per-period thresholds are unchanged year on year
    expect(r.thisPeriod.employeeNi).toBe(toPence(216.16));
    expect(r.thisPeriod.pensionEmployee).toBe(toPence(129.2));
  });
});

describe("cumulative vs month 1 basis", () => {
  it("period 1 agrees on both bases", () => {
    const cumulative = calculatePayrollPeriod(PAYSLIP, {
      frequency: "monthly",
      periodNumber: 1,
    });
    const month1 = calculatePayrollPeriod(PAYSLIP, {
      frequency: "monthly",
      periodNumber: 1,
      taxBasis: "month1",
    });
    expect(month1.thisPeriod.incomeTax).toBe(cumulative.thisPeriod.incomeTax);
  });

  it("month 12 cumulative tax equals the annual engine's tax", () => {
    const payroll = calculatePayrollPeriod(PAYSLIP, {
      frequency: "monthly",
      periodNumber: 12,
    });
    const annual = calculate(PAYSLIP);
    expect(payroll.yearToDate.incomeTax).toBe(annual.incomeTax.total);
    expect(payroll.yearToDate.gross).toBe(annual.gross.annual);
  });

  it("month 1 basis deducts the same amount every period", () => {
    const p6 = calculatePayrollPeriod(PAYSLIP, {
      frequency: "monthly",
      periodNumber: 6,
      taxBasis: "month1",
    });
    const p12 = calculatePayrollPeriod(PAYSLIP, {
      frequency: "monthly",
      periodNumber: 12,
      taxBasis: "month1",
    });
    expect(p6.thisPeriod.incomeTax).toBe(p12.thisPeriod.incomeTax);
    expect(p6.yearToDate.incomeTax).toBe(p6.thisPeriod.incomeTax * 6);
  });
});

describe("Employment Allowance is capped annually", () => {
  it("wipes out employer NI when the annual liability is below the cap", () => {
    const r = calculatePayrollPeriod(
      { ...PAYSLIP, employmentAllowance: true },
      { frequency: "monthly", periodNumber: 12 }
    );
    // Raw liability is £5,999.40, well under the £10,500 allowance.
    expect(r.yearToDate.employerNi).toBe(0);
  });

  it("caps year-to-date employer NI at £10,500 for a £100,000 salary", () => {
    const r = calculatePayrollPeriod(
      {
        taxYear: "2026/27",
        region: "england",
        grossAnnualSalary: 100000,
        employmentAllowance: true,
      },
      { frequency: "monthly", periodNumber: 12 }
    );
    expect(r.thisPeriod.employerNi).toBe(toPence(1187.45));
    expect(r.yearToDate.employerNi).toBe(toPence(3749.4));
  });
});

describe("period validation", () => {
  it("rejects out-of-range period numbers", () => {
    expect(() =>
      calculatePayrollPeriod(PAYSLIP, { frequency: "monthly", periodNumber: 13 })
    ).toThrow();
    expect(() =>
      calculatePayrollPeriod(PAYSLIP, { frequency: "weekly", periodNumber: 53 })
    ).toThrow();
  });
});
