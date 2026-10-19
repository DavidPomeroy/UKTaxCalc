import { describe, expect, it } from "vitest";
import { getRules } from "@/lib/tax/rules";
import { calculate } from "@/lib/tax/calculate";
import { toPence } from "@/lib/tax/money";
import type { Region, TaxYear } from "@/lib/tax/types";

/**
 * The rules store bands against TAXABLE income (after the Personal
 * Allowance), which is also how HMRC publishes them in the "Income after
 * allowances" table of "Income Tax rates and allowances". GOV.UK's headline
 * table (basic to £50,270, higher £50,271–£125,140) is expressed against
 * TOTAL income for someone on the standard allowance — it is not a second
 * set of taxable thresholds.
 */
function bandCeilings(taxYear: TaxYear, region: Region) {
  return getRules(taxYear).incomeTax[region].map((b) => ({
    name: b.name,
    rate: b.rate,
    upTo: b.upper === Infinity ? null : b.upper,
  }));
}

const RUK_BANDS = [
  { name: "basic", rate: 0.2, upTo: 37700 },
  { name: "higher", rate: 0.4, upTo: 125140 },
  { name: "additional", rate: 0.45, upTo: null },
];

const SCOTLAND_2026_27 = [
  { name: "starter", rate: 0.19, upTo: 3967 },
  { name: "basic", rate: 0.2, upTo: 16956 },
  { name: "intermediate", rate: 0.21, upTo: 31092 },
  { name: "higher", rate: 0.42, upTo: 62430 },
  { name: "advanced", rate: 0.45, upTo: 125140 },
  { name: "top", rate: 0.48, upTo: null },
];

const SCOTLAND_2025_26 = [
  { name: "starter", rate: 0.19, upTo: 2827 },
  { name: "basic", rate: 0.2, upTo: 14921 },
  { name: "intermediate", rate: 0.21, upTo: 31092 },
  { name: "higher", rate: 0.42, upTo: 62430 },
  { name: "advanced", rate: 0.45, upTo: 125140 },
  { name: "top", rate: 0.48, upTo: null },
];

describe("income tax bands match the published HMRC tables", () => {
  for (const taxYear of ["2026/27", "2025/26"] as TaxYear[]) {
    for (const region of ["england", "wales", "northern-ireland"] as Region[]) {
      it(`${taxYear} — ${region} basic/higher/additional`, () => {
        expect(bandCeilings(taxYear, region)).toEqual(RUK_BANDS);
      });
    }
  }

  it("2026/27 — Scotland six bands", () => {
    expect(bandCeilings("2026/27", "scotland")).toEqual(SCOTLAND_2026_27);
  });

  it("2025/26 — Scotland six bands (narrower starter/basic)", () => {
    expect(bandCeilings("2025/26", "scotland")).toEqual(SCOTLAND_2025_26);
  });

  it("the basic rate band is £37,700 of taxable income", () => {
    const rules = getRules("2026/27");
    const [basic] = rules.incomeTax.england;
    expect(basic.upper - basic.lower).toBe(37700);
    // With the standard allowance that is £12,571–£50,270 of gross income.
    expect(basic.upper + rules.personalAllowance).toBe(50270);
  });

  it("the top rate starts at £125,140 of taxable income, not £112,570", () => {
    for (const region of [
      "england",
      "wales",
      "northern-ireland",
      "scotland",
    ] as Region[]) {
      const bands = getRules("2026/27").incomeTax[region];
      expect(bands[bands.length - 1].lower).toBe(125140);
    }
  });
});


describe("band structure is sound", () => {
  for (const taxYear of ["2026/27", "2025/26"] as TaxYear[]) {
    for (const region of [
      "england",
      "wales",
      "scotland",
      "northern-ireland",
    ] as Region[]) {
      it(`${taxYear} — ${region} bands are contiguous and open-ended`, () => {
        const bands = getRules(taxYear).incomeTax[region];
        expect(bands[0].lower).toBe(0);
        // Bands share cumulative boundaries: each starts where the last ended
        for (let i = 1; i < bands.length; i++) {
          expect(bands[i].lower).toBe(bands[i - 1].upper);
        }
        expect(bands[bands.length - 1].upper).toBe(Infinity);
        // Rates increase monotonically (no regressive bands)
        for (let i = 1; i < bands.length; i++) {
          expect(bands[i].rate).toBeGreaterThan(bands[i - 1].rate);
        }
      });
    }
  }
});

describe("Personal Allowance and taper", () => {
  it("is £12,570 in both years", () => {
    expect(getRules("2026/27").personalAllowance).toBe(12570);
    expect(getRules("2025/26").personalAllowance).toBe(12570);
  });

  it("tapers £1 per £2 over £100,000, reaching zero at £125,140", () => {
    const rules = getRules("2026/27");
    expect(rules.paTaperThreshold).toBe(100000);
    expect(rules.paTaperDivisor).toBe(2);
    // The allowance is double the excess needed to remove it:
    // £12,570 × 2 = £25,140 above £100,000 → zero at £125,140.
    expect(rules.personalAllowance * rules.paTaperDivisor).toBe(25140);
    expect(rules.paTaperThreshold + 25140).toBe(125140);
  });
});

describe("band boundaries behave as published", () => {
  it("England: £50,270 is the last basic-rate pound", () => {
    const at = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 50270,
    });
    const above = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 50271,
    });
    expect(at.incomeTax.total).toBe(toPence(7540));
    expect(above.incomeTax.total).toBe(toPence(7540.4));
  });

  it("England: £125,140 is the last 40% pound once PA is gone", () => {
    const at = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 125140,
    });
    const above = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 125141,
    });
    expect(at.incomeTax.personalAllowance).toBe(0);
    // £37,700 × 20% + £87,440 × 40%
    expect(at.incomeTax.total).toBe(toPence(42516));
    expect(above.incomeTax.total - at.incomeTax.total).toBe(toPence(0.45));
  });

  it("England: 45% does not start inside the taper (£120,000)", () => {
    const r = calculate({
      taxYear: "2026/27",
      region: "england",
      grossAnnualSalary: 120000,
    });
    // Tapered allowance £2,570 → £117,430 taxable, all within the 40% band.
    expect(r.incomeTax.personalAllowance).toBe(toPence(2570));
    expect(r.incomeTax.taxableIncome).toBe(toPence(117430));
    expect(r.incomeTax.total).toBe(toPence(39432));
    expect(r.incomeTax.marginalRate).toBe(0.4);
    // 40% + 20% taper + 2% NI
    expect(r.takeHome.marginalRate).toBeCloseTo(0.62, 2);
  });

  it("Scotland 2026/27: £16,537 is the last 19% pound", () => {
    const at = calculate({
      taxYear: "2026/27",
      region: "scotland",
      grossAnnualSalary: 16537,
    });
    const above = calculate({
      taxYear: "2026/27",
      region: "scotland",
      grossAnnualSalary: 16538,
    });
    expect(at.incomeTax.total).toBe(toPence(753.73));
    // One pound more, now taxed at 20% instead of 19%.
    expect(above.incomeTax.total).toBe(toPence(753.93));
  });
});
