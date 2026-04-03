import { describe, expect, it } from "vitest";

import { formatInZone, localInputToMs, msToLocalInput, parseEpoch } from "./timestamp";

describe("timestamp", () => {
  it("detects seconds and milliseconds epoch inputs", () => {
    expect(parseEpoch("1700000000")).toEqual({ ms: 1_700_000_000_000, unit: "s" });
    expect(parseEpoch("1700000000001")).toEqual({ ms: 1_700_000_000_001, unit: "ms" });
    expect(parseEpoch("not-a-time")).toBeNull();
  });

  it("round-trips local datetime input values at minute precision", () => {
    const source = Date.UTC(2024, 0, 2, 3, 4, 0, 0);
    const input = msToLocalInput(source);

    expect(localInputToMs(input)).toBe(source);
  });

  it("formats valid and invalid timezones predictably", () => {
    expect(formatInZone(new Date(Date.UTC(2024, 0, 2, 3, 4, 5)), "UTC")).toContain("03:04:05");
    expect(formatInZone(new Date(), "Not/AZone")).toBe("Invalid timezone");
  });
});
