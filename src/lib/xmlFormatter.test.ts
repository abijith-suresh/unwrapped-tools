import { describe, expect, it } from "vitest";

import { formatXml } from "./xmlFormatter";

describe("formatXml", () => {
  it("formats compact XML with predictable indentation", () => {
    expect(formatXml('<root><item id="1">value</item><empty /></root>', { indent: 2 })).toEqual({
      ok: true,
      output: [
        "<root>",
        '  <item id="1">',
        "    value",
        "  </item>",
        "  <empty />",
        "</root>",
      ].join("\n"),
    });
  });

  it("normalizes already formatted XML to the requested indentation", () => {
    expect(
      formatXml("<root>\n<child>\n<name>demo</name>\n</child>\n</root>", { indent: 4 })
    ).toEqual({
      ok: true,
      output: [
        "<root>",
        "    <child>",
        "        <name>",
        "            demo",
        "        </name>",
        "    </child>",
        "</root>",
      ].join("\n"),
    });
  });

  it("returns clear feedback for malformed XML", () => {
    expect(formatXml("<root><child></root>", { indent: 2 })).toEqual({
      ok: false,
      error: expect.stringContaining("XML"),
    });
  });
});
