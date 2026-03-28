import { parse as parseEnv } from "dotenv";
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

function validateEnvInput(input: string) {
  let activeQuote: '"' | "'" | "`" | null = null;

  function updateQuoteState(
    line: string,
    startQuote: '"' | "'" | "`" | null
  ): '"' | "'" | "`" | null {
    let currentQuote = startQuote;
    let escaped = false;

    for (const character of line) {
      if (currentQuote === '"') {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (character === "\\") {
          escaped = true;
          continue;
        }

        if (character === '"') {
          currentQuote = null;
        }

        continue;
      }

      if (currentQuote === "'") {
        if (character === "'") {
          currentQuote = null;
        }
        continue;
      }

      if (currentQuote === "`") {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (character === "\\") {
          escaped = true;
          continue;
        }

        if (character === "`") {
          currentQuote = null;
        }
        continue;
      }

      if (character === '"' || character === "'" || character === "`") {
        currentQuote = character;
      }
    }

    return currentQuote;
  }

  for (const line of input.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    if (activeQuote) {
      activeQuote = updateQuoteState(line, activeQuote);
      continue;
    }

    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trimStart() : trimmed;
    const equalsIndex = withoutExport.indexOf("=");

    if (equalsIndex === -1) {
      throw new Error(`Invalid env entry: ${line}`);
    }

    const key = withoutExport.slice(0, equalsIndex).trim();
    const value = withoutExport.slice(equalsIndex + 1);

    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) {
      throw new Error(`Invalid env key: ${key}`);
    }

    const trimmedValue = value.trimStart();
    const openingQuote = trimmedValue[0];

    if (openingQuote === '"' || openingQuote === "'" || openingQuote === "`") {
      activeQuote = updateQuoteState(trimmedValue.slice(1), openingQuote);
    }
  }

  if (activeQuote) {
    throw new Error("Unterminated quoted env value");
  }
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
    validateEnvInput(input);
    const parsed = parseEnv(input);

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
