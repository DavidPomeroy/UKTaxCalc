import { describe, expect, it } from "vitest";
import { calculate } from "@/lib/tax/calculate";
import { toPence } from "@/lib/tax/money";
import { parseTaxCode } from "@/lib/tax/income-tax";

describe("pensions — £40,000, 5% employee / 3% employer, QE basis", () => {
  // Qualifying earnings at £40,000 = 40,000 − 6,240 = 33,760
  //   employee: 33,760 × 5% = £1,688.00
  //   employer: 33,760 × 3% = £1,012.80

  it("net-pay: £1,688 deducted pre-tax", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 40000,
      pension: { method: "net-pay", employeePercent: 5, employerPercent: 3, basis: "qualifying-earnings" },
    });
    expect(r.pension.employee).toBe(toPence(1688));
    expect(r.pension.employer).toBe(toPence(1012.8));
    // Taxable: 40,000 − 1,688 = 38,312 → (38,312 − 12,570) × 20% = 5,148.40
    expect(r.incomeTax.total).toBe(toPence(5148.4));
    // NI unchanged: (40,000 − 12,570) × 8% = 2,194.40
    expect(r.nationalInsurance.total).toBe(toPence(2194.4));
    expect(r.takeHome.annual).toBe(toPence(40000 - 1688 - 5148.4 - 2194.4));
  });

  it("salary-sacrifice: take-home bears no pension deduction", () => {
    const netPay = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 40000,
      pension: { method: "net-pay", employeePercent: 5, employerPercent: 3, basis: "qualifying-earnings" },
    });
    const sacrifice = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 40000,
      pension: { method: "salary-sacrifice", employeePercent: 5, employerPercent: 3, basis: "qualifying-earnings" },
    });
    // Pay cut to £38,000; take-home = 38,000 − 5,086 − 2,034.40 = 30,879.60
    expect(sacrifice.pension.salarySacrifice).toBe(toPence(2000));
    expect(sacrifice.pension.employee).toBe(0);
    expect(sacrifice.incomeTax.total).toBe(toPence(5086));
    expect(sacrifice.nationalInsurance.total).toBe(toPence(2034.4));
    expect(sacrifice.takeHome.annual).toBe(toPence(38000 - 5086 - 2034.4));
    expect(sacrifice.takeHome.annual).toBeLessThan(netPay.takeHome.annual);
  });

  it("relief-at-source: tax on full pay, pot gets 20% uplift", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 40000,
      pension: {
        method: "relief-at-source",
        employeePercent: 5,
        employerPercent: 3,
        basis: "qualifying-earnings",
      },
    });
    expect(r.pension.employee).toBe(toPence(1688));
    // Tax on full £40,000: (40,000 − 12,570) × 20% = 5,486.00
    expect(r.incomeTax.total).toBe(toPence(5486));
    // Gross pot: 1,688 / 0.8 = 2,110.00 + 1,012.80 employer
    expect(r.pension.grossContribution).toBe(toPence(2110) + toPence(1012.8));
  });
});

describe("tax codes and allowances", () => {
  it("parses numeric PAYE codes", () => {
    expect(parseTaxCode("1257L", 12570)).toBe(12570);
    expect(parseTaxCode("1200L", 12570)).toBe(12000);
    expect(parseTaxCode("BR", 12570)).toBe(0);
    expect(parseTaxCode("D0", 12570)).toBe(0);
    expect(parseTaxCode("0T", 12570)).toBe(0);
    expect(parseTaxCode("NT", 12570)).toBe(Infinity);
    expect(parseTaxCode("gibberish", 12570)).toBe(12570);
  });

  it("NT code pays no income tax", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 60000, taxCode: "NT" });
    expect(r.incomeTax.total).toBe(0);
  });

  it("blind person's allowance adds £3,250 (2026/27)", () => {
    const base = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 30000 });
    const bpa = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 30000, blindPersonsAllowance: true });
    expect(bpa.incomeTax.personalAllowance).toBe(toPence(12570 + 3250));
    // 3,250 × 20% = £650 saved
    expect(bpa.incomeTax.total).toBe(base.incomeTax.total - toPence(650));
  });

  it("marriage allowance receive adds £1,260 (saves £252 at basic rate)", () => {
    const base = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 30000 });
    const married = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 30000,
      marriageAllowanceReceive: true,
    });
    expect(married.incomeTax.total).toBe(base.incomeTax.total - toPence(252));
  });
});
