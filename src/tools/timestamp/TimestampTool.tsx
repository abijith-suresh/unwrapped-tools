import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface TimeZoneOption {
  label: string;
  tz: string;
}

const DEFAULT_ZONES: TimeZoneOption[] = [
  { label: "UTC", tz: "UTC" },
  { label: "US/Eastern", tz: "America/New_York" },
  { label: "US/Pacific", tz: "America/Los_Angeles" },
];

// Well-known IANA zones a user can choose from
const PRESET_ZONES: TimeZoneOption[] = [
  { label: "UTC", tz: "UTC" },
  { label: "US/Eastern", tz: "America/New_York" },
  { label: "US/Central", tz: "America/Chicago" },
  { label: "US/Mountain", tz: "America/Denver" },
  { label: "US/Pacific", tz: "America/Los_Angeles" },
  { label: "London", tz: "Europe/London" },
  { label: "Paris", tz: "Europe/Paris" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "Moscow", tz: "Europe/Moscow" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "India", tz: "Asia/Kolkata" },
  { label: "Bangkok", tz: "Asia/Bangkok" },
  { label: "Singapore", tz: "Asia/Singapore" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
  { label: "Auckland", tz: "Pacific/Auckland" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Try to interpret the input as an epoch (seconds or milliseconds). */
function parseEpoch(raw: string): { ms: number; unit: "s" | "ms" } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;

  // Heuristic: if > 1e12 treat as milliseconds, otherwise seconds
  if (Math.abs(n) > 1e12) {
    return { ms: n, unit: "ms" };
  }
  return { ms: n * 1000, unit: "s" };
}

/** Format a Date in a given IANA timezone. */
function formatInZone(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(",", "");
  } catch {
    return "Invalid timezone";
  }
}

/** Convert a datetime-local input value to epoch ms. */
function localInputToMs(value: string): number | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** Format ms epoch to datetime-local input value (local time). */
function msToLocalInput(ms: number): string {
  const d = new Date(ms);
  // datetime-local needs YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TimestampTool() {
  const [epochInput, setEpochInput] = createSignal("");
  const [datetimeInput, setDatetimeInput] = createSignal("");
  const [zones, setZones] = createSignal<TimeZoneOption[]>(DEFAULT_ZONES);

  const parsed = createMemo((): { ms: number; unit: "s" | "ms" } | null => {
    // Prefer epoch input; fall back to datetime-local
    const raw = epochInput().trim();
    if (raw) return parseEpoch(raw);
    const dtMs = localInputToMs(datetimeInput());
    if (dtMs !== null) return { ms: dtMs, unit: "ms" };
    return null;
  });

  const date = createMemo((): Date | null => {
    const p = parsed();
    if (!p) return null;
    const d = new Date(p.ms);
    return Number.isNaN(d.getTime()) ? null : d;
  });

  function useNow() {
    const now = Date.now();
    setEpochInput(String(Math.floor(now / 1000)));
    setDatetimeInput(msToLocalInput(now));
  }

  function handleEpochInput(value: string) {
    setEpochInput(value);
    const p = parseEpoch(value);
    if (p) {
      setDatetimeInput(msToLocalInput(p.ms));
    }
  }

  function handleDatetimeInput(value: string) {
    setDatetimeInput(value);
    const ms = localInputToMs(value);
    if (ms !== null) {
      setEpochInput(String(Math.floor(ms / 1000)));
    }
  }

  function changeZone(index: number, tz: string) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, tz } : z)));
  }

  const inputStyle = {
    padding: "0.625rem 0.875rem",
    "border-radius": "0.375rem",
    border: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "font-size": "0.875rem",
    outline: "none",
    "box-sizing": "border-box" as const,
  };

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
        gap: "1.5rem",
        padding: "1.5rem",
        "max-width": "760px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Input row                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "grid",
          "grid-template-columns": "1fr auto 1fr",
          gap: "1rem",
          "align-items": "end",
        }}
      >
        {/* Epoch input */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label style={labelStyle}>Unix timestamp</label>
          <input
            type="text"
            inputmode="numeric"
            value={epochInput()}
            onInput={(e) => handleEpochInput(e.currentTarget.value)}
            placeholder="e.g. 1700000000"
            style={{ ...inputStyle, width: "100%" }}
          />
          <Show when={parsed()}>
            {(p) => (
              <span style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                Detected: {p().unit === "s" ? "seconds" : "milliseconds"}
              </span>
            )}
          </Show>
        </div>

        {/* Now button */}
        <button
          onClick={useNow}
          style={{
            padding: "0.5rem 0.875rem",
            "border-radius": "0.375rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--accent-primary)",
            "font-size": "0.8125rem",
            "font-weight": "600",
            cursor: "pointer",
            "white-space": "nowrap",
          }}
        >
          Use now
        </button>

        {/* Datetime-local input */}
        <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
          <label style={labelStyle}>Date & time (local)</label>
          <input
            type="datetime-local"
            value={datetimeInput()}
            onInput={(e) => handleDatetimeInput(e.currentTarget.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Derived epoch values                                                */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              "flex-wrap": "wrap",
            }}
          >
            {/* Seconds */}
            <div
              style={{
                flex: "1",
                "min-width": "160px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
                padding: "0.875rem 1rem",
              }}
            >
              <div style={labelStyle}>Epoch (seconds)</div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  "margin-top": "0.375rem",
                }}
              >
                <code
                  style={{
                    "font-size": "0.9375rem",
                    color: "var(--accent-primary)",
                    "font-family":
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    flex: "1",
                    "word-break": "break-all",
                  }}
                >
                  {String(Math.floor(d().getTime() / 1000))}
                </code>
                <CopyButton text={String(Math.floor(d().getTime() / 1000))} />
              </div>
            </div>

            {/* Milliseconds */}
            <div
              style={{
                flex: "1",
                "min-width": "160px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
                padding: "0.875rem 1rem",
              }}
            >
              <div style={labelStyle}>Epoch (milliseconds)</div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  "margin-top": "0.375rem",
                }}
              >
                <code
                  style={{
                    "font-size": "0.9375rem",
                    color: "var(--accent-primary)",
                    "font-family":
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    flex: "1",
                    "word-break": "break-all",
                  }}
                >
                  {String(d().getTime())}
                </code>
                <CopyButton text={String(d().getTime())} />
              </div>
            </div>

            {/* ISO 8601 */}
            <div
              style={{
                flex: "2",
                "min-width": "220px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.5rem",
                padding: "0.875rem 1rem",
              }}
            >
              <div style={labelStyle}>ISO 8601</div>
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "0.5rem",
                  "margin-top": "0.375rem",
                }}
              >
                <code
                  style={{
                    "font-size": "0.875rem",
                    color: "var(--accent-success)",
                    "font-family":
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    flex: "1",
                    "word-break": "break-all",
                  }}
                >
                  {d().toISOString()}
                </code>
                <CopyButton text={d().toISOString()} />
              </div>
            </div>
          </div>
        )}
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Timezone panel                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.625rem 1rem",
                "border-bottom": "1px solid var(--border)",
              }}
            >
              <span style={labelStyle}>Timezone conversions</span>
            </div>

            <div
              style={{
                padding: "0.75rem 1rem",
                display: "flex",
                "flex-direction": "column",
                gap: "0.75rem",
              }}
            >
              <For each={zones()}>
                {(zone, i) => (
                  <div
                    style={{
                      display: "grid",
                      "grid-template-columns": "180px 1fr auto",
                      gap: "0.75rem",
                      "align-items": "center",
                    }}
                  >
                    {/* Zone selector */}
                    <select
                      value={zone.tz}
                      onChange={(e) => changeZone(i(), e.currentTarget.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        "border-radius": "0.25rem",
                        border: "1px solid var(--border)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        "font-size": "0.75rem",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <For each={PRESET_ZONES}>
                        {(preset) => <option value={preset.tz}>{preset.label}</option>}
                      </For>
                    </select>

                    {/* Formatted time */}
                    <code
                      style={{
                        "font-size": "0.875rem",
                        color: "var(--text-primary)",
                        "font-family":
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      }}
                    >
                      {formatInZone(d(), zone.tz)}
                    </code>

                    <CopyButton text={formatInZone(d(), zone.tz)} />
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>

      {/* Empty hint */}
      <Show when={!epochInput().trim() && !datetimeInput()}>
        <p
          style={{
            "font-size": "0.8125rem",
            color: "var(--text-muted)",
            margin: "0",
          }}
        >
          Enter a Unix timestamp (seconds or ms auto-detected) or pick a date above
        </p>
      </Show>
    </div>
  );
}
