# Agent Instructions — unwrapped.tools

## Overview

- `unwrapped.tools` is a desktop-first, local-only Astro PWA with multiple developer tools.
- Preserve the local-only product posture unless the user explicitly changes it.

## Stack

- Astro 5
- SolidJS
- Tailwind CSS v4
- TypeScript strict mode
- Bun

## Commands

- Install deps: `bun install`
- Dev server: `bun run dev`
- Quality gate: `bun run verify`
- Individual steps: `bun run type-check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`

## Project Map

- `src/tools/registry.ts`: single source of truth for tool metadata and routing
- `src/tools/`: tool-specific UI and behavior
- `src/lib/`: shared logic, persistence helpers, runtime guards
- `src/components/`: shared UI primitives and shells
- `src/pages/tools/[slug].astro`: dynamic tool route

## Hard Rules

- Keep all tool execution client-side. Do not add server processing, uploads, analytics, or telemetry.
- Do not persist tool inputs by default. If persistence is required, document it and register keys in `src/lib/localPersistence.ts`.
- Use `src/lib/fileImport.ts` for user file reads so limits and error handling stay consistent.
- If you add a tool, update `src/tools/registry.ts`. Do not duplicate tool metadata elsewhere.
- Keep privacy, settings, and storage behavior aligned.
- Use the `@/` path alias for `src` imports.

## Git And CI

- Branch from the latest `main` before starting changes.
- Never commit directly to `main`.
- Commit and PR titles must use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`.
- Before push, run `bun run verify`.
- `pre-commit` runs `lint-staged`, `commit-msg` runs `commitlint`, and `pre-push` runs `bun run verify`.
- CI enforces `quality` and `pr-title` checks on pull requests.
- Squash merge is the expected merge strategy.
