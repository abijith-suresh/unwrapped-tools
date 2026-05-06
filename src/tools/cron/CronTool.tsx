import { createMemo, createSignal, For, Show } from "solid-js";

import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { buildCronScheduleSummary, type CronTimeZoneMode } from "@/lib/cronSchedule";
import { SUPPORTED_CRON_SYNTAX } from "@/lib/cron";

function formatPreview(date: Date, mode: CronTimeZoneMode): string {
  return mode === "utc"
    ? `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`
    : date.toLocaleString();
}

export default function CronTool() {
  const [input, setInput] = createSignal("30 9 * * 1");
  const [timeZone, setTimeZone] = createSignal<CronTimeZoneMode>("local");

  const summary = createMemo(() =>
    buildCronScheduleSummary(input(), {
      start: new Date(),
      count: 5,
      timeZone: timeZone(),
    })
  );
  const description = createMemo(() => {
    const current = summary();
    return current.ok ? current.description : "";
  });
  const nextRuns = createMemo(() => {
    const current = summary();
    return current.ok ? current.nextRuns : [];
  });
  const error = createMemo(() => {
    const current = summary();
    return current.ok ? "" : current.error.message;
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
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "900px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label style={labelStyle}>Cron expression</label>
        <input
          type="text"
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          spellcheck={false}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: `1px solid ${error() ? "var(--accent-error)" : "var(--border)"}`,
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "font-size": "0.9375rem",
            outline: "none",
            "box-sizing": "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", "flex-wrap": "wrap", "align-items": "center" }}>
        <span style={labelStyle}>Timezone</span>
        <ToolActionButton
          active={timeZone() === "local"}
          variant={timeZone() === "local" ? "primary" : "secondary"}
          onClick={() => setTimeZone("local")}
        >
          Local time
        </ToolActionButton>
        <ToolActionButton
          active={timeZone() === "utc"}
          variant={timeZone() === "utc" ? "primary" : "secondary"}
          onClick={() => setTimeZone("utc")}
        >
          UTC
        </ToolActionButton>
      </div>

      <Show
        when={!error()}
        fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
      >
        <section
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "0.75rem",
            padding: "1rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.75rem",
          }}
        >
          <span style={labelStyle}>Humanized schedule</span>
          <strong style={{ color: "var(--text-primary)", "font-size": "1.1rem" }}>
            {description()}
          </strong>
        </section>

        <section
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "0.75rem",
            padding: "1rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.75rem",
          }}
        >
          <span style={labelStyle}>Next runs</span>
          <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
            <For each={nextRuns()}>
              {(run, index) => (
                <code
                  style={{
                    padding: "0.625rem 0.75rem",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    "border-radius": "0.5rem",
                    color: "var(--text-primary)",
                    display: "block",
                  }}
                >
                  {index() + 1}. {formatPreview(run, timeZone())}
                </code>
              )}
            </For>
          </div>
        </section>
      </Show>

      <ToolStatusMessage tone="muted">
        Supported subset: {SUPPORTED_CRON_SYNTAX.fieldOrder.join(" ")} · operators{" "}
        {SUPPORTED_CRON_SYNTAX.operators.join(" ")} · preview computation stays local-only.
      </ToolStatusMessage>
    </div>
  );
}
