import { describe, expect, it } from "vitest";

import { parseCronExpression } from "./cron";
import { buildCronScheduleSummary, describeCronSchedule, getNextCronRuns } from "./cronSchedule";

describe("describeCronSchedule", () => {
  it("humanizes stepped schedules with explicit timezone wording", () => {
    const parsed = parseCronExpression("*/15 * * * *");
    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      throw new Error("Expected a parsed cron expression.");
    }

    expect(describeCronSchedule(parsed.value, "utc")).toBe("Every 15 minutes using UTC");
  });

  it("humanizes weekday-specific schedules", () => {
    const parsed = parseCronExpression("30 9 * * 1");
    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      throw new Error("Expected a parsed cron expression.");
    }

    expect(describeCronSchedule(parsed.value, "local")).toBe("At 09:30 on Monday using local time");
  });
});

describe("getNextCronRuns", () => {
  it("generates upcoming run previews locally from the parsed schedule", () => {
    const parsed = parseCronExpression("30 9 * * 1");
    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      throw new Error("Expected a parsed cron expression.");
    }

    const runs = getNextCronRuns(parsed.value, {
      start: new Date("2024-01-01T08:45:00Z"),
      count: 2,
      timeZone: "utc",
    });

    expect(runs.map((run) => run.toISOString())).toEqual([
      "2024-01-01T09:30:00.000Z",
      "2024-01-08T09:30:00.000Z",
    ]);
  });
});

describe("buildCronScheduleSummary", () => {
  it("reuses parser errors for invalid expressions", () => {
    expect(
      buildCronScheduleSummary("* * *", {
        start: new Date("2024-01-01T00:00:00Z"),
        count: 3,
        timeZone: "utc",
      })
    ).toEqual({
      ok: false,
      error: {
        field: "expression",
        message: "Cron expressions must contain exactly five fields.",
      },
    });
  });
});
