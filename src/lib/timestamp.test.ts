import { describe, expect, it } from "vitest";

import {
  formatInZone,
  getDerivedTimestampFormats,
  localInputToMs,
  msToLocalInput,
  parseEpoch,
} from "./timestamp";

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

  it("builds a derived output matrix from a canonical date", () => {
    const derived = getDerivedTimestampFormats(new Date(Date.UTC(2024, 0, 2, 3, 4, 5)));

    expect(derived.map((item) => item.label)).toEqual([
      "ISO 8601",
      "RFC 3339",
      "RFC 7231",
      "UTC string",
      "ISO 9075",
      "Mongo ObjectID seed",
    ]);
    expect(derived.find((item) => item.label === "RFC 3339")?.value).toBe(
      "2024-01-02T03:04:05.000Z"
    );
    expect(derived.find((item) => item.label === "RFC 7231")?.value).toBe(
      "Tue, 02 Jan 2024 03:04:05 GMT"
    );
    expect(derived.find((item) => item.label === "ISO 9075")?.value).toBe("2024-01-02 03:04:05");
    expect(derived.find((item) => item.label === "Mongo ObjectID seed")?.value).toBe("65937d25");
  });
});
