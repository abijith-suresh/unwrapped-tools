import { describe, expect, it } from "vitest";

import { isDiffSessionState, shouldPersistDiffSession } from "./diffSession";

describe("diff session schema", () => {
  it("accepts valid diff session state", () => {
    expect(
      isDiffSessionState({
        leftLang: "toml",
        rightLang: "yaml",
        changesOnly: true,
      })
    ).toBe(true);
  });

  it("rejects invalid diff session state", () => {
    expect(
      isDiffSessionState({
        leftLang: "toml",
        rightLang: "yaml",
        changesOnly: "yes",
      })
    ).toBe(false);
  });

  it("persists only when the diff preferences differ from the baseline", () => {
    expect(
      shouldPersistDiffSession({
        leftLang: "text",
        rightLang: "text",
        changesOnly: true,
      })
    ).toBe(false);
    expect(
      shouldPersistDiffSession({
        leftLang: "json",
        rightLang: "text",
        changesOnly: true,
      })
    ).toBe(true);
  });
});
