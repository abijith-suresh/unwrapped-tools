# twish

A desktop-first, local-first PWA for comparing configs, code, and plain text without uploading anything.

Built because comparing environment-specific config files at work kept turning into a noisy, awkward workflow. `twish` keeps the diff local, fast, and installable.

Live at: **[twish.vercel.app](https://twish.vercel.app)**

## What it does

- **Live side-by-side diff** — compare two inputs instantly as you type, paste, drop, or open files
- **Config-friendly workflow** — works especially well for JSON, YAML, `.env`, and other text-based config files
- **Changes-only view** — focus on meaningful lines without losing nearby context
- **Rich editor surface** — CodeMirror 6 with syntax highlighting for common developer file types
- **Offline-first PWA** — install it and keep using `/app` after the first successful load
- **Private by design** — no file uploads, no server-side diffing, no analytics; processing stays in your browser

## Stack

- [Astro 5](https://astro.build) — static site framework
- [SolidJS](https://www.solidjs.com) — interactive diff interface
- [Tailwind CSS v4](https://tailwindcss.com) — styling and design system primitives
- [CodeMirror 6](https://codemirror.net) — editor surface
- [diff](https://github.com/kpdecker/jsdiff) — line diff engine
- [Bun](https://bun.sh) — package manager and runtime
- [Vercel](https://vercel.com) — production hosting

## Development

```sh
bun install        # install dependencies
bun dev            # start dev server at localhost:4321
bun build          # build for production
bun preview        # preview production build
bun run lint       # run ESLint
bun run format     # run Prettier
bun run test       # run tests
bun run type-check # TypeScript check
```

See [AGENTS.md](./AGENTS.md) for full commands, project conventions, and AI agent instructions.

## Project Structure

```
src/
├── components/
│   ├── layout/        # Header, Footer
│   ├── landing/       # Hero, FeatureCard
│   └── app/           # Solid app components
├── layouts/
│   ├── BaseLayout.astro
│   ├── MarketingLayout.astro
│   └── AppLayout.astro
├── pages/
│   ├── index.astro    # Landing page
│   ├── features.astro
│   ├── about.astro
│   ├── docs.astro
│   ├── changelog.astro
│   └── app.astro      # The diff tool
└── styles/
    └── global.css
```

## Contributing

All contributions welcome — open an issue or PR. See [AGENTS.md](./AGENTS.md) for code conventions and branch/commit rules.

## License

[MIT](./LICENSE)
