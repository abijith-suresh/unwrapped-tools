import { createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

const ALGORITHMS: Algorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

interface HashResult {
  algorithm: Algorithm;
  hex: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashText(text: string, algorithm: Algorithm): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const buffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HashGenerator() {
  const [input, setInput] = createSignal("");
  const [results, setResults] = createSignal<HashResult[]>([]);
  const [computing, setComputing] = createSignal(false);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function compute(text: string) {
    if (!text.trim()) {
      setResults([]);
      return;
    }
    setComputing(true);
    try {
      const computed = await Promise.all(
        ALGORITHMS.map(async (alg) => ({
          algorithm: alg,
          hex: await hashText(text, alg),
        }))
      );
      setResults(computed);
    } finally {
      setComputing(false);
    }
  }

  function handleInput(value: string) {
    setInput(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void compute(value), 300);
  }

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "860px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Input                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label
          style={{
            "font-size": "0.75rem",
            "font-weight": "600",
            "letter-spacing": "0.05em",
            "text-transform": "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          Input text
        </label>
        <textarea
          value={input()}
          onInput={(e) => handleInput(e.currentTarget.value)}
          placeholder="Type or paste text to hash…"
          rows={5}
          spellcheck={false}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "font-size": "0.875rem",
            "line-height": "1.6",
            resize: "vertical",
            outline: "none",
            "box-sizing": "border-box",
          }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Computing indicator                                                 */}
      {/* ------------------------------------------------------------------ */}
      <Show when={computing()}>
        <p
          style={{
            "font-size": "0.8125rem",
            color: "var(--text-muted)",
            margin: "0",
          }}
        >
          Computing…
        </p>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Results                                                             */}
      {/* ------------------------------------------------------------------ */}
      <Show when={results().length > 0}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "0.75rem",
          }}
        >
          <For each={results()}>
            {(result) => (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  "border-radius": "0.5rem",
                  overflow: "hidden",
                }}
              >
                {/* Row header */}
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    padding: "0.5rem 1rem",
                    "border-bottom": "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      "font-size": "0.75rem",
                      "font-weight": "700",
                      "letter-spacing": "0.05em",
                      "text-transform": "uppercase",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {result.algorithm}
                  </span>
                  <CopyButton text={result.hex} />
                </div>

                {/* Hash value */}
                <pre
                  style={{
                    margin: "0",
                    padding: "0.75rem 1rem",
                    "font-size": "0.8125rem",
                    "line-height": "1.6",
                    color: "var(--text-primary)",
                    "font-family":
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    "white-space": "pre-wrap",
                    "word-break": "break-all",
                  }}
                >
                  {result.hex}
                </pre>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Empty hint */}
      <Show when={!input().trim() && results().length === 0}>
        <p
          style={{
            "font-size": "0.8125rem",
            color: "var(--text-muted)",
            margin: "0",
          }}
        >
          SHA-1 · SHA-256 · SHA-384 · SHA-512 computed via the browser's Web Crypto API
        </p>
      </Show>
    </div>
  );
}
