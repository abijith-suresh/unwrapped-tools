import { describe, expect, it } from "vitest";

import {
  normalizeEnvForDiff,
  normalizeJsonForDiff,
  normalizeYamlForDiff,
  prepareStructuredCompare,
} from "./structuredCompare";

describe("structured compare utilities", () => {
  it("normalizes JSON with stable key ordering", () => {
    const result = normalizeJsonForDiff('{"z":1,"a":2,"nested":{"b":1,"a":2}}');

    expect(result).toEqual({
      ok: true,
      output: '{\n  "a": 2,\n  "nested": {\n    "a": 2,\n    "b": 1\n  },\n  "z": 1\n}',
    });
  });

  it("preserves array order while normalizing nested values", () => {
    const result = normalizeJsonForDiff('{"items":[{"b":1,"a":2},{"d":4,"c":3}]}');

    expect(result).toEqual({
      ok: true,
      output:
        '{\n  "items": [\n    {\n      "a": 2,\n      "b": 1\n    },\n    {\n      "c": 3,\n      "d": 4\n    }\n  ]\n}',
    });
  });

  it("treats empty JSON inputs as valid empty content", () => {
    expect(normalizeJsonForDiff("   ")).toEqual({ ok: true, output: "" });
  });

  it("uses normalized JSON when both sides parse successfully", () => {
    const result = prepareStructuredCompare({
      original: '{"b":2,"a":1}',
      modified: '{"a":1,"b":2}',
      leftLanguage: "json",
      rightLanguage: "json",
    });

    expect(result).toEqual({
      original: '{\n  "a": 1,\n  "b": 2\n}',
      modified: '{\n  "a": 1,\n  "b": 2\n}',
      strategy: "json",
      errors: [],
    });
  });

  it("falls back to text diff and reports invalid JSON errors", () => {
    const result = prepareStructuredCompare({
      original: '{"a":1',
      modified: '{"a":1,"b":2}',
      leftLanguage: "json",
      rightLanguage: "json",
    });

    expect(result.strategy).toBe("text");
    expect(result.original).toBe('{"a":1');
    expect(result.modified).toBe('{"a":1,"b":2}');
    expect(result.errors).toEqual([
      {
        side: "left",
        message: expect.any(String),
      },
    ]);
  });

  it("keeps raw text mode when both panels are not JSON", () => {
    const result = prepareStructuredCompare({
      original: "A=1\nB=2",
      modified: "A=1\nB=3",
      leftLanguage: "text",
      rightLanguage: "text",
    });

    expect(result).toEqual({
      original: "A=1\nB=2",
      modified: "A=1\nB=3",
      strategy: "text",
      errors: [],
    });
  });

  it("normalizes YAML with stable key ordering", () => {
    const result = normalizeYamlForDiff("z: 1\na: 2\nnested:\n  b: 1\n  a: 2\n");

    expect(result).toEqual({
      ok: true,
      output: "a: 2\nnested:\n  a: 2\n  b: 1\nz: 1",
    });
  });

  it("uses normalized YAML when both sides are YAML", () => {
    const result = prepareStructuredCompare({
      original: "b: 2\na: 1\n",
      modified: "a: 1\nb: 2\n",
      leftLanguage: "yaml",
      rightLanguage: "yaml",
    });

    expect(result).toEqual({
      original: "a: 1\nb: 2",
      modified: "a: 1\nb: 2",
      strategy: "yaml",
      errors: [],
    });
  });

  it("normalizes env files by sorting keys and ignoring comments", () => {
    const result = normalizeEnvForDiff(
      "# comment\nAPI_URL=https://example.com # prod\n export TOKEN = abc123 \n\nMODE=prod\n"
    );

    expect(result).toEqual({
      ok: true,
      output: "API_URL=https://example.com\nMODE=prod\nTOKEN=abc123",
    });
  });

  it("preserves multiline quoted env values", () => {
    const result = normalizeEnvForDiff('PRIVATE_KEY="line1\nline2"\nTOKEN=abc\n');

    expect(result).toEqual({
      ok: true,
      output: "PRIVATE_KEY=line1\nline2\nTOKEN=abc",
    });
  });

  it("accepts escaped quotes inside double-quoted env values", () => {
    const result = normalizeEnvForDiff('QUOTE_TEST="a\\"b"\nTOKEN=abc\n');

    expect(result).toEqual({
      ok: true,
      output: 'QUOTE_TEST=a\\"b\nTOKEN=abc',
    });
  });

  it("preserves literal backslashes in double-quoted env values", () => {
    const result = normalizeEnvForDiff('PATH="C:\\Program Files\\App"\nTAB="\\t"\n');

    expect(result).toEqual({
      ok: true,
      output: "PATH=C:\\Program Files\\App\nTAB=\\t",
    });
  });

  it("accepts multiline single-quoted env values", () => {
    const result = normalizeEnvForDiff("PRIVATE_KEY='line1\nline2'\nTOKEN=abc\n");

    expect(result).toEqual({
      ok: true,
      output: "PRIVATE_KEY=line1\nline2\nTOKEN=abc",
    });
  });

  it("accepts dotted and dashed env keys", () => {
    const result = normalizeEnvForDiff("FOO.BAR=baz\nFOO-BAR=qux\n");

    expect(result).toEqual({
      ok: true,
      output: "FOO-BAR=qux\nFOO.BAR=baz",
    });
  });

  it("accepts multiline backtick-quoted env values", () => {
    const result = normalizeEnvForDiff("PRIVATE_KEY=`line1\nline2`\nTOKEN=abc\n");

    expect(result).toEqual({
      ok: true,
      output: "PRIVATE_KEY=line1\nline2\nTOKEN=abc",
    });
  });

  it("accepts bare quote characters inside unquoted env values", () => {
    const result = normalizeEnvForDiff('A=foo"bar\nTOKEN=abc\n');

    expect(result).toEqual({
      ok: true,
      output: 'A=foo"bar\nTOKEN=abc',
    });
  });

  it("ignores trailing comments after quoted env values", () => {
    const result = normalizeEnvForDiff('A="x" # comment "quoted"\nTOKEN=abc\n');

    expect(result).toEqual({
      ok: true,
      output: "A=x\nTOKEN=abc",
    });
  });

  it("rejects unterminated quoted env values", () => {
    expect(normalizeEnvForDiff('A="foo\nTOKEN=abc\n')).toEqual({
      ok: false,
      message: "Unterminated quoted env value",
    });

    expect(normalizeEnvForDiff("A='foo\nTOKEN=abc\n")).toEqual({
      ok: false,
      message: "Unterminated quoted env value",
    });

    expect(normalizeEnvForDiff("A=`foo\nTOKEN=abc\n")).toEqual({
      ok: false,
      message: "Unterminated quoted env value",
    });
  });

  it("uses normalized env output when both sides are env files", () => {
    const result = prepareStructuredCompare({
      original: "TOKEN=abc\nAPI_URL=https://example.com\n",
      modified: "API_URL=https://example.com\nTOKEN=abc\n",
      leftLanguage: "env",
      rightLanguage: "env",
    });

    expect(result).toEqual({
      original: "API_URL=https://example.com\nTOKEN=abc",
      modified: "API_URL=https://example.com\nTOKEN=abc",
      strategy: "env",
      errors: [],
    });
  });

  it("falls back to text diff and reports invalid env errors", () => {
    const result = prepareStructuredCompare({
      original: "INVALID LINE",
      modified: "TOKEN=abc",
      leftLanguage: "env",
      rightLanguage: "env",
    });

    expect(result.strategy).toBe("text");
    expect(result.errors).toEqual([
      {
        side: "left",
        message: expect.any(String),
      },
    ]);
  });

  it("normalizes multi-document YAML consistently", () => {
    const result = normalizeYamlForDiff("b: 2\na: 1\n---\nservice:\n  z: 3\n  a: 1\n");

    expect(result).toEqual({
      ok: true,
      output: "a: 1\nb: 2\n---\nservice:\n  a: 1\n  z: 3",
    });
  });

  it("falls back to text diff and reports invalid YAML errors", () => {
    const result = prepareStructuredCompare({
      original: "service: [",
      modified: "service:\n  image: app:latest\n",
      leftLanguage: "yaml",
      rightLanguage: "yaml",
    });

    expect(result.strategy).toBe("text");
    expect(result.errors).toEqual([
      {
        side: "left",
        message: expect.any(String),
      },
    ]);
  });
});
