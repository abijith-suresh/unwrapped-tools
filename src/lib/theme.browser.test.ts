// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY } from "./localPersistence";
import { DEFAULT_THEME, getTheme, initTheme, setTheme } from "./theme";

describe("theme browser runtime", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("reads the default theme when storage is empty", () => {
    expect(getTheme()).toBe(DEFAULT_THEME);
  });

  it("ignores invalid stored themes", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "broken-theme");

    expect(getTheme()).toBe(DEFAULT_THEME);
  });

  it("persists and applies the selected theme", () => {
    setTheme("nord");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("nord");
    expect(document.documentElement.getAttribute("data-theme")).toBe("nord");
  });

  it("falls back to the default theme when storage access throws", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(getTheme()).toBe(DEFAULT_THEME);

    getItemSpy.mockRestore();
  });

  it("applies the selected theme even when persistence fails", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => setTheme("nord")).not.toThrow();
    expect(document.documentElement.getAttribute("data-theme")).toBe("nord");

    setItemSpy.mockRestore();
  });

  it("initializes the document theme from storage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "gruvbox");

    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("gruvbox");
  });
});
