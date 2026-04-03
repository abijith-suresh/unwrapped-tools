import { createSignal, For, onCleanup, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { type HashResult, hashTextWithAlgorithms } from "@/lib/hash";

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
      setComputing(false);
      return;
    }

    setComputing(true);

    try {
      const computed = await hashTextWithAlgorithms(text);
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

  function handleClear() {
    clearTimeout(debounceTimer);
    setInput("");
    setResults([]);
    setComputing(false);
  }

  onCleanup(() => {
    clearTimeout(debounceTimer);
  });

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
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "0.75rem",
        }}
      >
        <ToolActionButton
          onClick={() => void compute(input())}
          variant="primary"
          disabled={!input().trim()}
        >
          Hash input
        </ToolActionButton>
        <ToolActionButton
          onClick={handleClear}
          disabled={!input().trim() && results().length === 0}
        >
          Clear
        </ToolActionButton>
        <span style={{ "font-size": "0.8125rem", color: "var(--text-muted)" }}>
          Local-only hashing via the browser&apos;s Web Crypto API
        </span>
      </div>

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
        <ToolStatusMessage tone="muted">Computing…</ToolStatusMessage>
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
        <ToolStatusMessage tone="muted">
          SHA-1 · SHA-256 · SHA-384 · SHA-512 computed via the browser's Web Crypto API
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
