import tailwindcss from "@tailwindcss/vite";
import solid from "@astrojs/solid-js";
import { defineConfig } from "astro/config";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://twish.vercel.app",
  integrations: [
    solid(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/app/",
        name: "Twish",
        short_name: "Twish",
        description:
          "Desktop-first, local-first config compare tool for JSON, YAML, env files, code, and text.",
        theme_color: "#89b4fa",
        background_color: "#1e1e2e",
        display: "standalone",
        start_url: "/app/",
        scope: "/app/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/app/",
      },
    }),
  ],
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    // Bundle isolation verified: marketing pages (/, /features, /about, /docs, /changelog)
    // load zero JS. CodeMirror and SolidJS chunks are referenced only from /app.
    // No manualChunks needed — Astro's default Vite splitting handles this correctly.
  },
});
