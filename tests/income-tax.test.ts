import { describe, expect, it } from "vitest";
import { calculate } from "@/lib/tax/calculate";
import { toPence } from "@/lib/tax/money";

describe("income tax — England, 2026/27", () => {
  it("£30,000 pays £3,486.00 tax", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 30000 });
    expect(r.incomeTax.total).toBe(toPence(3486));
    expect(r.incomeTax.personalAllowance).toBe(toPence(12570));
    expect(r.incomeTax.taxableIncome).toBe(toPence(17430));
  });

  it("£30,000 takes home £25,119.60", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 30000 });
    expect(r.nationalInsurance.total).toBe(toPence(1394.4));
    expect(r.takeHome.annual).toBe(toPence(25119.6));
  });

  it("£60,000 pays £11,431.80 tax, £3,210.60 NI, nets £45,357.60", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 60000 });
    expect(r.incomeTax.total).toBe(toPence(11431.8));
    expect(r.nationalInsurance.total).toBe(toPence(3210.6));
    expect(r.takeHome.annual).toBe(toPence(45357.6));
  });

  it("£100,000 pays £27,431.80 tax", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 100000 });
    expect(r.incomeTax.total).toBe(toPence(27431.8));
    expect(r.incomeTax.personalAllowance).toBe(toPence(12570));
  });

  it("£110,000 tapers PA to £7,570", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 110000 });
    expect(r.incomeTax.personalAllowance).toBe(toPence(7570));
  });

  it("£125,140 removes PA entirely (£0) and pays £43,144.25 tax", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 125140 });
    expect(r.incomeTax.personalAllowance).toBe(0);
    expect(r.incomeTax.total).toBe(toPence(43144.25));
  });

  it("£150,000 pays £54,331.25 tax", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 150000 });
    expect(r.incomeTax.total).toBe(toPence(54331.25));
  });

  it("marginal rate is 42% at £60,000 (40% + 2% NI)", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 60000 });
    expect(r.takeHome.marginalRate).toBeCloseTo(0.42, 2);
  });

  it("marginal rate is 62% mid-taper at £110,000", () => {
    const r = calculate({ taxYear: "2026/27", region: "england", grossAnnualSalary: 110000 });
    expect(r.takeHome.marginalRate).toBeCloseTo(0.62, 2);
  });
});

describe("income tax — Scotland", () => {
  it("£50,000 (2026/27) pays £8,981.82 tax", () => {
    const r = calculate({ taxYear: "2026/27", region: "scotland", grossAnnualSalary: 50000 });
    expect(r.incomeTax.total).toBe(toPence(8981.82));
  });

  it("£50,000 (2026/27) takes home £38,023.78", () => {
    const r = calculate({ taxYear: "2026/27", region: "scotland", grossAnnualSalary: 50000 });
    expect(r.nationalInsurance.total).toBe(toPence(2994.4));
    expect(r.takeHome.annual).toBe(toPence(38023.78));
  });

  it("£50,000 (2025/26) pays more than 2026/27 (tighter starter/basic bands)", () => {
    const current = calculate({ taxYear: "2026/27", region: "scotland", grossAnnualSalary: 50000 });
    const prior = calculate({ taxYear: "2025/26", region: "scotland", grossAnnualSalary: 50000 });
    expect(prior.incomeTax.total).toBeGreaterThan(current.incomeTax.total);
  });

  it("£30,000 rUK boards match across England, Wales and NI", () => {
    const salary = 30000;
    for (const region of ["england", "wales", "northern-ireland"] as const) {
      const r = calculate({ taxYear: "2026/27", region, grossAnnualSalary: salary });
      expect(r.incomeTax.total).toBe(toPence(3486));
    }
  });
});
