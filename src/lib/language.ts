export const SUPPORTED_LANGUAGES = [
  "text",
  "json",
  "yaml",
  "env",
  "javascript",
  "typescript",
  "python",
  "markdown",
  "xml",
  "html",
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
