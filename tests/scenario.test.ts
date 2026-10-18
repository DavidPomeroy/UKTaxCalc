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
