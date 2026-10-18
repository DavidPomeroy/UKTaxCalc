import { describe, expect, it } from "vitest";
import { calculate } from "@/lib/tax/calculate";
import { toPence } from "@/lib/tax/money";

describe("national insurance — employee", () => {
  it("nothing below the £12,570 primary threshold", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 12000 });
    expect(r.nationalInsurance.total).toBe(0);
  });

  it("£60,000 pays £3,210.60 (8% to UEL, 2% above)", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 60000 });
    const bandMap = Object.fromEntries(
      r.nationalInsurance.bands.map((b) => [b.name, b])
    );
    expect(bandMap.main.tax).toBe(toPence(3016));
    expect(bandMap.upper.tax).toBe(toPence(194.6));
    expect(r.nationalInsurance.total).toBe(toPence(3210.6));
  });
});

describe("national insurance — employer", () => {
  it("£60,000 costs £8,250 employer NI (15% above £5,000)", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 60000 });
    expect(r.employer.ni).toBe(toPence(8250));
    expect(r.employer.totalCost).toBe(toPence(60000 + 8250));
  });

  it("employment allowance wipes out £8,250 liability (£0 payable, £8,250 benefit)", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 60000,
      employmentAllowance: true,
    });
    expect(r.employer.ni).toBe(0);
    expect(r.employer.employmentAllowanceBenefit).toBe(toPence(8250));
  });
});

describe("student loans", () => {
  it("£35,000 on Plan 2 (2026/27) repays £505.35", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 35000,
      studentLoans: ["plan2"],
    });
    expect(r.studentLoan.total).toBe(toPence(505.35));
  });

  it("nothing below threshold", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 20000,
      studentLoans: ["plan2"],
    });
    expect(r.studentLoan.total).toBe(0);
  });

  it("dual Plan 2 + Postgraduate applies 9% and 6% independently", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 40000,
      studentLoans: ["plan2", "postgraduate"],
    });
    // Plan 2: (40,000 − 29,385) × 9% = 955.35
    // PGL:    (40,000 − 21,000) × 6% = 1,140.00
    expect(r.studentLoan.total).toBe(toPence(955.35 + 1140));
  });
});
