import { describe, expect, it } from "vitest";

import { decodeUrlText, encodeUrlText } from "./urlEncoding";

describe("encodeUrlText", () => {
  it("percent-encodes representative spaces, unicode, and reserved characters", () => {
    expect(encodeUrlText("hello world/π?test=1&ok=true")).toBe(
      "hello%20world%2F%CF%80%3Ftest%3D1%26ok%3Dtrue"
    );
  });
});

describe("decodeUrlText", () => {
  it("decodes representative percent-encoded input", () => {
    expect(decodeUrlText("hello%20world%2F%CF%80%3Ftest%3D1%26ok%3Dtrue")).toEqual({
      ok: true,
      value: "hello world/π?test=1&ok=true",
    });
  });

  it("surfaces a clear error for malformed percent sequences", () => {
    expect(decodeUrlText("hello%2Gworld%")).toEqual({
      ok: false,
      error: "Invalid percent-encoded input.",
    });
  });
});
