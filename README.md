# unwrapped.tools

`unwrapped.tools` is a desktop-first, local-first PWA for developer utilities that run entirely in the browser.

No server. No uploads. No tracking.

## Current tools

- JWT Decoder
- Text Diff
- Base64
- JSON Formatter
- Hash Generator
- UUID Generator
- Timestamp Converter
- Regex Tester

## Product principles

- Local-only processing: tool input stays on the device
- Installable PWA: works offline after the first successful load
- Shared shell: every tool route runs inside the same editor-style interface
- Conservative persistence: preferences may persist locally, but tool inputs do not persist by default

See `/privacy` in the app for the current local persistence contract.

## Stack

- Astro 5
- SolidJS
- Tailwind CSS v4
- TypeScript strict mode
- Bun
- Vercel

## Development

```sh
bun install
bun dev
bun build
bun preview
bun run type-check
bun run lint
bun run format
bun run test
```

See `AGENTS.md` for project conventions, architecture notes, and contributor instructions.
