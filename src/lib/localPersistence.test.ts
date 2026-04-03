import { describe, expect, it, vi } from "vitest";

import {
  clearLocalPersistence,
  DIFF_SESSION_STORAGE_KEY,
  LAST_TOOL_ROUTE_STORAGE_KEY,
  LOCAL_PERSISTENCE_ENTRIES,
  THEME_STORAGE_KEY,
} from "./localPersistence";

describe("localPersistence", () => {
  it("documents the expected local-only keys", () => {
    expect(LOCAL_PERSISTENCE_ENTRIES.map((entry) => entry.key)).toEqual([
      THEME_STORAGE_KEY,
      LAST_TOOL_ROUTE_STORAGE_KEY,
      DIFF_SESSION_STORAGE_KEY,
    ]);
  });

  it("clears each registered persistence key", () => {
    const removeItem = vi.fn();

    clearLocalPersistence({ removeItem });

    expect(removeItem).toHaveBeenCalledTimes(LOCAL_PERSISTENCE_ENTRIES.length);
    expect(removeItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    expect(removeItem).toHaveBeenCalledWith(LAST_TOOL_ROUTE_STORAGE_KEY);
    expect(removeItem).toHaveBeenCalledWith(DIFF_SESSION_STORAGE_KEY);
  });
});
