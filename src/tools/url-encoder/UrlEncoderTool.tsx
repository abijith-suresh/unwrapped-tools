import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { decodeUrlText, encodeUrlText } from "@/lib/urlEncoding";

export default function UrlEncoderTool() {
  const [plainText, setPlainText] = createSignal("");
  const [encodedText, setEncodedText] = createSignal("");

  const encodedOutput = createMemo(() => encodeUrlText(plainText()));
  const decodedOutput = createMemo(() => decodeUrlText(encodedText()));
  const decodedValue = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? current.value : "";
  });
  const decodeError = createMemo(() => {
    const current = decodedOutput();
    return current.ok ? "" : current.error;
  });

  const labelStyle = {
    "font-size": "0.75rem",
    "font-weight": "600" as const,
    "letter-spacing": "0.05em",
    "text-transform": "uppercase" as const,
    color: "var(--text-secondary)",
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "1100px",
        margin: "0 auto",
        width: "100%",
        "grid-template-columns": "repeat(auto-fit, minmax(320px, 1fr))",
      }}
    >
      <section
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "1rem",
          padding: "1rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          "border-radius": "0.75rem",
        }}
      >
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label style={labelStyle}>Plain text</label>
          <textarea
            value={plainText()}
            onInput={(event) => setPlainText(event.currentTarget.value)}
            placeholder="Enter text to percent-encode…"
            rows={7}
            spellcheck={false}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              "border-radius": "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
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

        <div
          style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}
        >
          <span style={labelStyle}>Encoded output</span>
          <CopyButton text={encodedOutput()} label="Copy encoded" />
        </div>
        <pre
          style={{
            margin: "0",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: "1px solid var(--border)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "font-size": "0.875rem",
            "line-height": "1.7",
            "min-height": "7rem",
            "white-space": "pre-wrap",
            "word-break": "break-all",
          }}
        >
          {encodedOutput() || "—"}
        </pre>
      </section>

      <section
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "1rem",
          padding: "1rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          "border-radius": "0.75rem",
        }}
      >
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label style={labelStyle}>Percent-encoded text</label>
          <textarea
            value={encodedText()}
            onInput={(event) => setEncodedText(event.currentTarget.value)}
            placeholder="Enter percent-encoded text to decode…"
            rows={7}
            spellcheck={false}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              "border-radius": "0.5rem",
              border: `1px solid ${decodeError() ? "var(--accent-error)" : "var(--border)"}`,
              background: "var(--bg-primary)",
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

        <Show
          when={!decodeError()}
          fallback={<ToolStatusMessage tone="error">{decodeError()}</ToolStatusMessage>}
        >
          <div
            style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}
          >
            <span style={labelStyle}>Decoded output</span>
            <CopyButton text={decodedValue()} label="Copy decoded" />
          </div>
          <pre
            style={{
              margin: "0",
              padding: "0.875rem 1rem",
              "border-radius": "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "font-size": "0.875rem",
              "line-height": "1.7",
              "min-height": "7rem",
              "white-space": "pre-wrap",
              "word-break": "break-all",
            }}
          >
            {decodedValue() || "—"}
          </pre>
        </Show>
      </section>
    </div>
  );
}
