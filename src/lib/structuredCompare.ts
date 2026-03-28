import { parseAllDocuments, stringify } from "yaml";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface StructuredCompareError {
  side: "left" | "right";
  message: string;
}

export interface StructuredCompareResult {
  original: string;
  modified: string;
  strategy: "text" | "json" | "yaml";
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

export function prepareStructuredCompare(input: {
  original: string;
  modified: string;
  leftLanguage: string;
  rightLanguage: string;
}): StructuredCompareResult {
  const { original, modified, leftLanguage, rightLanguage } = input;

  if (leftLanguage !== "json" || rightLanguage !== "json") {
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
