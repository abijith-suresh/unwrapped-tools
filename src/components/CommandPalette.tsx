import {
  Binary,
  Braces,
  Clock,
  Fingerprint,
  GitCompare,
  KeyRound,
  Regex,
  Search,
  Shuffle,
} from "lucide-solid";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { JSX } from "solid-js";

import { searchTools } from "@/lib/search";
import { getTheme, setTheme, type ThemeName, THEMES } from "@/lib/theme";
import { type Tool, tools } from "@/tools/registry";

// Hardcoded accent hex values for cross-theme color dot previews (explicitly allowed)
const THEME_ACCENTS: Record<string, string> = {
  dracula: "#bd93f9",
  catppuccin: "#cba6f7",
  nord: "#88c0d0",
  gruvbox: "#d3869b",
};

// Map of lucide icon name → component
const ICON_MAP: Record<string, (props: { size?: number; class?: string }) => JSX.Element> = {
  KeyRound: (p) => <KeyRound {...p} />,
  GitCompare: (p) => <GitCompare {...p} />,
  Binary: (p) => <Binary {...p} />,
  Braces: (p) => <Braces {...p} />,
  Fingerprint: (p) => <Fingerprint {...p} />,
  Shuffle: (p) => <Shuffle {...p} />,
  Clock: (p) => <Clock {...p} />,
  Regex: (p) => <Regex {...p} />,
};

function ToolIcon(props: { name: string; size?: number; class?: string }) {
  const Icon = ICON_MAP[props.name];
  if (Icon) return <Icon size={props.size} class={props.class} />;
  return <Search size={props.size} class={props.class} />;
}

export default function CommandPalette() {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [results, setResults] = createSignal<Tool[]>(tools);
  const [activeTheme, setActiveTheme] = createSignal<ThemeName>(getTheme());

  // eslint-disable-next-line no-unassigned-vars
  let inputRef: HTMLInputElement | undefined;
  // eslint-disable-next-line no-unassigned-vars
  let listRef: HTMLUListElement | undefined;

  // Show theme section when query is empty or matches theme-related terms
  const showThemeSection = () => {
    const q = query().toLowerCase();
    return q === "" || /theme|color|dracula|catppuccin|nord|gruvbox/.test(q);
  };

  // Total navigable items = tool results + (theme rows when section visible)
  const totalItems = () => results().length + (showThemeSection() ? THEMES.length : 0);

  // Update results when query changes
  createEffect(() => {
    const filtered = searchTools(tools, query());
    setResults(filtered);
    setSelectedIndex(0);
  });

  function openPalette() {
    setOpen(true);
    setQuery("");
  }

  function closePalette() {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  function navigateTo(slug: string) {
    closePalette();
    window.location.href = `/tools/${slug}`;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open()) return;

    const len = totalItems();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, len - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const rlen = results().length;
      if (selectedIndex() < rlen) {
        const tool = results()[selectedIndex()];
        if (tool) navigateTo(tool.slug);
      } else if (showThemeSection()) {
        const themeIdx = selectedIndex() - rlen;
        const theme = THEMES[themeIdx];
        if (theme) {
          setTheme(theme.name);
          setActiveTheme(theme.name);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    } else if (e.key === "Tab") {
      // Basic focus trap: keep focus inside modal
      e.preventDefault();
      inputRef?.focus();
    }
  }

  function handleGlobalKeyDown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modKey = isMac ? e.metaKey : e.ctrlKey;
    if (modKey && e.key === "k") {
      e.preventDefault();
      if (open()) {
        closePalette();
      } else {
        openPalette();
      }
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  // Auto-focus input when palette opens
  createEffect(() => {
    if (open()) {
      // Defer to next tick so the element is in the DOM
      setTimeout(() => inputRef?.focus(), 0);
    }
  });

  // Scroll selected item into view
  // Theme section header row (aria-hidden, non-interactive) sits between tool rows and theme rows.
  // We offset by 1 to skip it when scrolling to theme rows.
  createEffect(() => {
    const idx = selectedIndex();
    const rlen = results().length;
    if (listRef) {
      // If index is in tool rows, scroll directly; if in theme rows, offset +1 for header li
      const domIdx = idx < rlen ? idx : idx + 1;
      const item = listRef.children[domIdx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  });

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openPalette}
        aria-label="Open command palette"
        class="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus:outline-none"
        style={{
          "background-color": "var(--bg-secondary)",
          "border-color": "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <Search size={12} />
        <span>Search</span>
        <span class="flex items-center gap-0.5">
          <kbd
            class="rounded px-1 py-0.5 text-[10px] font-mono"
            style={{
              "background-color": "var(--bg-primary)",
              "border-color": "var(--border)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            ⌘
          </kbd>
          <kbd
            class="rounded px-1 py-0.5 text-[10px] font-mono"
            style={{
              "background-color": "var(--bg-primary)",
              "border-color": "var(--border)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            K
          </kbd>
        </span>
      </button>

      {/* Overlay + Modal */}
      <Show when={open()}>
        {/* Backdrop */}
        <div
          class="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
          style={{ "background-color": "rgba(0, 0, 0, 0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePalette();
          }}
        >
          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            class="flex w-full max-w-[600px] flex-col overflow-hidden rounded-md shadow-2xl"
            style={{
              "background-color": "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "max-height": "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input row */}
            <div
              class="flex items-center gap-3 px-4 py-3"
              style={{ "border-bottom": "1px solid var(--border)" }}
            >
              <Search size={16} style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tools..."
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
                aria-label="Search tools"
                autocomplete="off"
                spellcheck={false}
              />
              <kbd
                class="hidden rounded px-1.5 py-0.5 text-[10px] font-mono sm:block"
                style={{
                  "background-color": "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                esc
              </kbd>
            </div>

            {/* Results list */}
            <ul
              ref={listRef}
              class="overflow-y-auto py-1"
              style={{ "max-height": "380px" }}
              role="listbox"
              aria-label="Tool results"
            >
              <Show
                when={results().length > 0}
                fallback={
                  <li class="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No tools found for &ldquo;{query()}&rdquo;
                  </li>
                }
              >
                <For each={results()}>
                  {(tool, index) => (
                    <li
                      role="option"
                      aria-selected={selectedIndex() === index()}
                      onClick={() => navigateTo(tool.slug)}
                      onMouseEnter={() => setSelectedIndex(index())}
                      class="flex cursor-pointer items-center gap-3 rounded-none px-3 py-2 transition-colors"
                      style={{
                        "background-color":
                          selectedIndex() === index()
                            ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                            : "transparent",
                        "border-left":
                          selectedIndex() === index()
                            ? "2px solid var(--accent-primary)"
                            : "2px solid transparent",
                        "padding-left":
                          selectedIndex() === index() ? "calc(0.75rem - 2px)" : "0.75rem",
                      }}
                    >
                      {/* Icon */}
                      <span
                        style={{
                          color:
                            selectedIndex() === index()
                              ? "var(--accent-primary)"
                              : "var(--text-secondary)",
                          "flex-shrink": "0",
                          display: "flex",
                        }}
                      >
                        <ToolIcon name={tool.icon} size={16} />
                      </span>

                      {/* Text */}
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span
                            class="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {tool.name}
                          </span>
                          <span
                            class="text-[10px] font-medium uppercase tracking-wide"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {tool.category}
                          </span>
                          <Show when={tool.isNew}>
                            <span
                              class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{
                                "background-color":
                                  "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                                color: "var(--accent-primary)",
                              }}
                            >
                              New
                            </span>
                          </Show>
                        </div>
                        <p
                          class="mt-0.5 truncate text-[12px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {tool.description}
                        </p>
                      </div>

                      {/* Enter hint */}
                      <Show when={selectedIndex() === index()}>
                        <kbd
                          class="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono sm:block"
                          style={{
                            "background-color": "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          ↵
                        </kbd>
                      </Show>
                    </li>
                  )}
                </For>
              </Show>

              {/* COLOR THEME section */}
              <Show when={showThemeSection()}>
                {/* Section header — non-interactive, skipped by arrow key nav */}
                <li
                  class="px-3 py-1"
                  style={{
                    "border-top": "1px solid var(--border)",
                    "background-color": "var(--bg-tertiary)",
                  }}
                  aria-hidden="true"
                >
                  <span
                    class="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    COLOR THEME
                  </span>
                </li>
                <For each={THEMES}>
                  {(theme, themeIndex) => {
                    const itemIndex = () => results().length + themeIndex();
                    const isActive = () => activeTheme() === theme.name;
                    const isSelected = () => selectedIndex() === itemIndex();
                    return (
                      <li
                        role="option"
                        aria-selected={isSelected()}
                        onClick={() => {
                          setTheme(theme.name);
                          setActiveTheme(theme.name);
                          setSelectedIndex(itemIndex());
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIndex())}
                        class="flex cursor-pointer items-center gap-3 rounded-none py-2 transition-colors"
                        style={{
                          "background-color": isSelected()
                            ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                            : "transparent",
                          "border-left": isSelected()
                            ? "2px solid var(--accent-primary)"
                            : "2px solid transparent",
                          "padding-left": isSelected() ? "calc(0.75rem - 2px)" : "0.75rem",
                          "padding-right": "0.75rem",
                        }}
                      >
                        {/* Color dot */}
                        <span
                          style={{
                            display: "inline-block",
                            width: "12px",
                            height: "12px",
                            "border-radius": "50%",
                            "background-color": THEME_ACCENTS[theme.name],
                            "flex-shrink": "0",
                          }}
                        />
                        {/* Theme name */}
                        <span
                          class="flex-1 text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {theme.label}
                        </span>
                        {/* Active checkmark */}
                        <Show when={isActive()}>
                          <span class="text-sm" style={{ color: "var(--accent-primary)" }}>
                            ✓
                          </span>
                        </Show>
                      </li>
                    );
                  }}
                </For>
              </Show>
            </ul>
          </div>
        </div>
      </Show>
    </>
  );
}
