import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCENARIO,
  formatPeriodGBP,
  perPeriodPence,
  scenarioFromSearchParams,
  scenarioToSearchParams,
} from "@/lib/calculator/scenario";

describe("pay frequency (freq param)", () => {
  it("defaults to annual", () => {
    expect(scenarioFromSearchParams({}).payFrequency).toBe("annual");
  });

  it("parses monthly and weekly from the URL", () => {
    expect(scenarioFromSearchParams({ freq: "monthly" }).payFrequency).toBe("monthly");
    expect(scenarioFromSearchParams({ freq: "weekly" }).payFrequency).toBe("weekly");
  });

  it("rejects invalid frequencies", () => {
    expect(scenarioFromSearchParams({ freq: "fortnightly" }).payFrequency).toBe("annual");
  });

  it("serializes freq only when non-default, and round-trips", () => {
    expect(scenarioToSearchParams(DEFAULT_SCENARIO).has("freq")).toBe(false);

    const params = scenarioToSearchParams({
      ...DEFAULT_SCENARIO,
      payFrequency: "weekly",
    });
    expect(params.get("freq")).toBe("weekly");

    const roundTripped = scenarioFromSearchParams(
      Object.fromEntries(params.entries())
    );
    expect(roundTripped.payFrequency).toBe("weekly");
  });
});

describe("per-period scaling", () => {
  it("scales annual pence into monthly and weekly", () => {
    // £45,357.40 → £3,779.78/month, £872.26/week
    const annual = 4_535_740;
    expect(perPeriodPence(annual, "annual")).toBe(annual);
    expect(perPeriodPence(annual, "monthly")).toBe(377_978);
    expect(perPeriodPence(annual, "weekly")).toBe(87_226);
  });

  it("formats per-period GBP", () => {
    expect(formatPeriodGBP(4_535_740, "monthly")).toBe("£3,779.78");
    expect(formatPeriodGBP(4_535_740, "weekly")).toBe("£872.26");
    expect(formatPeriodGBP(4_535_740, "annual")).toBe("£45,357.40");
  });
});


describe("payroll view options (period and basis params)", () => {
  it("defaults to period 1 on a cumulative basis when payroll is selected", () => {
    const s = scenarioFromSearchParams({ freq: "monthly" });
    expect(s.periodNumber).toBe(1);
    expect(s.taxBasis).toBe("cumulative");
  });

  it("parses period and basis", () => {
    const s = scenarioFromSearchParams({
      freq: "monthly",
      period: "6",
      basis: "month1",
    });
    expect(s.periodNumber).toBe(6);
    expect(s.taxBasis).toBe("month1");
  });

  it("clamps the period to the frequency (12 monthly, 52 weekly)", () => {
    expect(
      scenarioFromSearchParams({ freq: "monthly", period: "13" }).periodNumber
    ).toBe(12);
    expect(
      scenarioFromSearchParams({ freq: "weekly", period: "99" }).periodNumber
    ).toBe(52);
    expect(
      scenarioFromSearchParams({ freq: "monthly", period: "0" }).periodNumber
    ).toBe(1);
  });

  it("ignores payroll options in annual mode", () => {
    const s = scenarioFromSearchParams({ period: "6", basis: "month1" });
    expect(s.periodNumber).toBeUndefined();
    expect(s.taxBasis).toBeUndefined();
  });

  it("serializes period only above 1 and basis only for month 1", () => {
    const base = { ...DEFAULT_SCENARIO, payFrequency: "monthly" as const };
    expect(scenarioToSearchParams(base).has("period")).toBe(false);
    expect(scenarioToSearchParams(base).has("basis")).toBe(false);

    const params = scenarioToSearchParams({
      ...base,
      periodNumber: 6,
      taxBasis: "month1",
    });
    expect(params.get("freq")).toBe("monthly");
    expect(params.get("period")).toBe("6");
    expect(params.get("basis")).toBe("month1");
  });

  it("round-trips the payroll view through the URL", () => {
    const original = {
      ...DEFAULT_SCENARIO,
      payFrequency: "weekly" as const,
      periodNumber: 23,
      taxBasis: "month1" as const,
    };
    const roundTripped = scenarioFromSearchParams(
      Object.fromEntries(scenarioToSearchParams(original).entries())
    );
    expect(roundTripped.payFrequency).toBe("weekly");
    expect(roundTripped.periodNumber).toBe(23);
    expect(roundTripped.taxBasis).toBe("month1");
  });
});
