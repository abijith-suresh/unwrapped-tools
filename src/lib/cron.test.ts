import { describe, expect, it } from "vitest";

import { parseCronExpression, SUPPORTED_CRON_SYNTAX } from "./cron";

describe("cron parser", () => {
  it("documents the supported five-field syntax subset", () => {
    expect(SUPPORTED_CRON_SYNTAX.fieldOrder).toEqual([
      "minute",
      "hour",
      "dayOfMonth",
      "month",
      "dayOfWeek",
    ]);
    expect(SUPPORTED_CRON_SYNTAX.operators).toEqual(["*", ",", "-", "/"]);
  });

  it("parses a wildcard-only five-field expression", () => {
    const result = parseCronExpression("* * * * *");

    expect(result).toEqual({
      ok: true,
      value: {
        minute: { kind: "wildcard", raw: "*" },
        hour: { kind: "wildcard", raw: "*" },
        dayOfMonth: { kind: "wildcard", raw: "*" },
        month: { kind: "wildcard", raw: "*" },
        dayOfWeek: { kind: "wildcard", raw: "*" },
      },
    });
  });

  it("rejects expressions that do not contain exactly five fields", () => {
    const result = parseCronExpression("* * * *");

    expect(result).toEqual({
      ok: false,
      error: {
        field: "expression",
        message: "Cron expressions must contain exactly five fields.",
      },
    });
  });

  it("parses fixed numeric values for each field", () => {
    const result = parseCronExpression("5 4 3 2 1");

    expect(result).toEqual({
      ok: true,
      value: {
        minute: { kind: "value", raw: "5", value: 5 },
        hour: { kind: "value", raw: "4", value: 4 },
        dayOfMonth: { kind: "value", raw: "3", value: 3 },
        month: { kind: "value", raw: "2", value: 2 },
        dayOfWeek: { kind: "value", raw: "1", value: 1 },
      },
    });
  });

  it("rejects values outside the allowed field range", () => {
    const result = parseCronExpression("60 * * * *");

    expect(result).toEqual({
      ok: false,
      error: {
        field: "minute",
        message: "Minute must be between 0 and 59.",
      },
    });
  });

  it("parses inclusive numeric ranges", () => {
    const result = parseCronExpression("1-5 * * * *");

    expect(result).toEqual({
      ok: true,
      value: {
        minute: {
          kind: "range",
          raw: "1-5",
          start: 1,
          end: 5,
        },
        hour: { kind: "wildcard", raw: "*" },
        dayOfMonth: { kind: "wildcard", raw: "*" },
        month: { kind: "wildcard", raw: "*" },
        dayOfWeek: { kind: "wildcard", raw: "*" },
      },
    });
  });

  it("parses wildcard steps", () => {
    const result = parseCronExpression("*/15 * * * *");

    expect(result).toEqual({
      ok: true,
      value: {
        minute: {
          kind: "step",
          raw: "*/15",
          base: { kind: "wildcard", raw: "*" },
          step: 15,
        },
        hour: { kind: "wildcard", raw: "*" },
        dayOfMonth: { kind: "wildcard", raw: "*" },
        month: { kind: "wildcard", raw: "*" },
        dayOfWeek: { kind: "wildcard", raw: "*" },
      },
    });
  });

  it("parses comma-separated lists", () => {
    const result = parseCronExpression("1,15,30 * * * *");

    expect(result).toEqual({
      ok: true,
      value: {
        minute: {
          kind: "list",
          raw: "1,15,30",
          items: [
            { kind: "value", raw: "1", value: 1 },
            { kind: "value", raw: "15", value: 15 },
            { kind: "value", raw: "30", value: 30 },
          ],
        },
        hour: { kind: "wildcard", raw: "*" },
        dayOfMonth: { kind: "wildcard", raw: "*" },
        month: { kind: "wildcard", raw: "*" },
        dayOfWeek: { kind: "wildcard", raw: "*" },
      },
    });
  });

  it("parses stepped ranges", () => {
    const result = parseCronExpression("1-10/2 * * * *");

    expect(result).toEqual({
      ok: true,
      value: {
        minute: {
          kind: "step",
          raw: "1-10/2",
          base: {
            kind: "range",
            raw: "1-10",
            start: 1,
            end: 10,
          },
          step: 2,
        },
        hour: { kind: "wildcard", raw: "*" },
        dayOfMonth: { kind: "wildcard", raw: "*" },
        month: { kind: "wildcard", raw: "*" },
        dayOfWeek: { kind: "wildcard", raw: "*" },
      },
    });
  });

  it("rejects zero or negative steps", () => {
    const result = parseCronExpression("*/0 * * * *");

    expect(result).toEqual({
      ok: false,
      error: {
        field: "minute",
        message: "Minute step must be greater than 0.",
      },
    });
  });

  it("rejects reversed ranges with a specific error", () => {
    const result = parseCronExpression("10-1 * * * *");

    expect(result).toEqual({
      ok: false,
      error: {
        field: "minute",
        message: "Minute range start must be less than or equal to the end.",
      },
    });
  });

  it("rejects unsupported aliases and special syntax", () => {
    const result = parseCronExpression("* * * JAN MON");

    expect(result).toEqual({
      ok: false,
      error: {
        field: "month",
        message: "Month contains unsupported syntax.",
      },
    });
  });
});
