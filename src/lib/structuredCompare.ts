import { parseAllDocuments, stringify } from "yaml";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface StructuredCompareError {
  side: "left" | "right";
  message: string;
}

export interface StructuredCompareResult {
  original: string;
  modified: string;
  strategy: "text" | "json" | "yaml" | "env";
  errors: StructuredCompareError[];
}

interface NormalizeJsonSuccess {
  ok: true;
  output: string;
}

interface NormalizeJsonFailure {
  ok: false;
  message: string;
}

type NormalizeJsonResult = NormalizeJsonSuccess | NormalizeJsonFailure;
type NormalizeYamlResult = NormalizeJsonResult;
type NormalizeEnvResult = NormalizeJsonResult;

const ENV_LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

function isIgnorableEnvGap(segment: string): boolean {
  return /^(?:\s*(?:#.*)?\n?)*$/.test(segment);
}

function parseEnvRecord(input: string): Record<string, string> {
  const normalizedInput = input.replace(/\r\n?/g, "\n");
  const values: Record<string, string> = {};
  let lastMatchEnd = 0;

  for (const match of normalizedInput.matchAll(ENV_LINE)) {
    const [fullMatch, key, rawValue = ""] = match;
    const matchIndex = match.index ?? 0;
    const gap = normalizedInput.slice(lastMatchEnd, matchIndex);

    if (!isIgnorableEnvGap(gap)) {
      throw new Error(`Invalid env entry: ${gap.trim()}`);
    }

    let value = rawValue.trim();
    const maybeQuote = value[0];

    if (
      (maybeQuote === '"' || maybeQuote === "'" || maybeQuote === "`") &&
      !/^(['"`])([\s\S]*)\1$/u.test(value)
    ) {
      throw new Error("Unterminated quoted env value");
    }

    value = value.replace(/^(['"`])([\s\S]*)\1$/u, "$2");

    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    }

    values[key] = value;
    lastMatchEnd = matchIndex + fullMatch.length;
  }

  const trailingSegment = normalizedInput.slice(lastMatchEnd);

  if (!isIgnorableEnvGap(trailingSegment)) {
    throw new Error(`Invalid env entry: ${trailingSegment.trim()}`);
  }

  return values;
}

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
      .reduce<{ [key: string]: JsonValue }>((acc, key) => {
        acc[key] = sortJsonValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function normalizeJsonForDiff(input: string): NormalizeJsonResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = JSON.parse(input) as JsonValue;
    const sorted = sortJsonValue(parsed);
    return { ok: true, output: JSON.stringify(sorted, null, 2) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid JSON input",
    };
  }
}

export function normalizeYamlForDiff(input: string): NormalizeYamlResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const documents = parseAllDocuments(input);

    for (const document of documents) {
      if (document.errors.length > 0) {
        throw document.errors[0];
      }
    }

    const normalizedDocuments = documents.map((document) => {
      const parsed = document.toJS() as JsonValue;
      const sorted = sortJsonValue(parsed);
      return stringify(sorted, {
        defaultStringType: "PLAIN",
        sortMapEntries: true,
      }).trimEnd();
    });

    return {
      ok: true,
      output: normalizedDocuments.join("\n---\n"),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid YAML input",
    };
  }
}

export function normalizeEnvForDiff(input: string): NormalizeEnvResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = parseEnvRecord(input);

    const output = Object.entries(parsed)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid env input",
    };
  }
}

export function prepareStructuredCompare(input: {
  original: string;
  modified: string;
  leftLanguage: string;
  rightLanguage: string;
}): StructuredCompareResult {
  const { original, modified, leftLanguage, rightLanguage } = input;

  if (leftLanguage !== "json" || rightLanguage !== "json") {
    if (leftLanguage === "env" && rightLanguage === "env") {
      const left = normalizeEnvForDiff(original);
      const right = normalizeEnvForDiff(modified);

      if (left.ok && right.ok) {
        return {
          original: left.output,
          modified: right.output,
          strategy: "env",
          errors: [],
        };
      }

      const errors: StructuredCompareError[] = [];

      if (!left.ok) {
        errors.push({ side: "left", message: left.message });
      }

      if (!right.ok) {
        errors.push({ side: "right", message: right.message });
      }

      return {
        original,
        modified,
        strategy: "text",
        errors,
      };
    }

    if (leftLanguage === "yaml" && rightLanguage === "yaml") {
      const left = normalizeYamlForDiff(original);
      const right = normalizeYamlForDiff(modified);

      if (left.ok && right.ok) {
        return {
          original: left.output,
          modified: right.output,
          strategy: "yaml",
          errors: [],
        };
      }

      const errors: StructuredCompareError[] = [];

      if (!left.ok) {
        errors.push({ side: "left", message: left.message });
      }

      if (!right.ok) {
        errors.push({ side: "right", message: right.message });
      }

      return {
        original,
        modified,
        strategy: "text",
        errors,
      };
    }

    return {
      original,
      modified,
      strategy: "text",
      errors: [],
    };
  }

  const left = normalizeJsonForDiff(original);
  const right = normalizeJsonForDiff(modified);

  if (left.ok && right.ok) {
    return {
      original: left.output,
      modified: right.output,
      strategy: "json",
      errors: [],
    };
  }

  const errors: StructuredCompareError[] = [];

  if (!left.ok) {
    errors.push({ side: "left", message: left.message });
  }

  if (!right.ok) {
    errors.push({ side: "right", message: right.message });
  }

  return {
    original,
    modified,
    strategy: "text",
    errors,
  };
}
