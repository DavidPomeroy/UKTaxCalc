import { describe, expect, it } from "vitest";
import { getRules } from "@/lib/tax/rules";
import { calculate } from "@/lib/tax/calculate";
import { toPence } from "@/lib/tax/money";
import type { Region, TaxYear } from "@/lib/tax/types";

/**
 * The rules store bands against TAXABLE income (after the Personal
 * Allowance). GOV.UK publishes them against TOTAL income. This helper
 * converts back, so the assertions below compare like with like.
 */
function publishedBands(taxYear: TaxYear, region: Region) {
  const pa = getRules(taxYear).personalAllowance;
  return getRules(taxYear).incomeTax[region].map((b) => ({
    name: b.name,
    rate: b.rate,
    from: b.lower + pa,
    to: b.upper === Infinity ? null : b.upper + pa,
  }));
}

const RUK_BANDS_2026_27 = [
  { name: "basic", rate: 0.2, from: 12570, to: 50270 },
  { name: "higher", rate: 0.4, from: 50271, to: 125140 },
  { name: "additional", rate: 0.45, from: 125141, to: null },
];

const SCOTLAND_2026_27 = [
  { name: "starter", rate: 0.19, from: 12570, to: 16537 },
  { name: "basic", rate: 0.2, from: 16538, to: 29526 },
  { name: "intermediate", rate: 0.21, from: 29527, to: 43662 },
  { name: "higher", rate: 0.42, from: 43663, to: 75000 },
  { name: "advanced", rate: 0.45, from: 75001, to: 125140 },
  { name: "top", rate: 0.48, from: 125141, to: null },
];

const SCOTLAND_2025_26 = [
  { name: "starter", rate: 0.19, from: 12570, to: 15397 },
  { name: "basic", rate: 0.2, from: 15398, to: 27491 },
  { name: "intermediate", rate: 0.21, from: 27492, to: 43662 },
  { name: "higher", rate: 0.42, from: 43663, to: 75000 },
  { name: "advanced", rate: 0.45, from: 75001, to: 125140 },
  { name: "top", rate: 0.48, from: 125141, to: null },
];

describe("income tax bands match the published GOV.UK tables", () => {
  for (const taxYear of ["2026/27", "2025/26"] as TaxYear[]) {
    for (const region of ["england", "wales", "northern-ireland"] as Region[]) {
      it(`${taxYear} — ${region} basic/higher/additional`, () => {
        expect(publishedBands(taxYear, region)).toEqual(RUK_BANDS_2026_27);
      });
    }
  }

  it("2026/27 — Scotland six bands", () => {
    expect(publishedBands("2026/27", "scotland")).toEqual(SCOTLAND_2026_27);
  });

  it("2025/26 — Scotland six bands (narrower starter/basic)", () => {
    expect(publishedBands("2025/26", "scotland")).toEqual(SCOTLAND_2025_26);
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
        // Inclusive bounds: each band starts one pound above the previous end
        for (let i = 1; i < bands.length; i++) {
          expect(bands[i].lower).toBe(bands[i - 1].upper + 1);
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
    expect(above.incomeTax.total).toBe(toPence(7540.2));
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
    expect(above.incomeTax.total - at.incomeTax.total).toBe(toPence(0.45));
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
    expect(above.incomeTax.total).toBe(toPence(753.92));
  });
});
