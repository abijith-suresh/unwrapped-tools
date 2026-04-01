/* eslint-disable no-console */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const fontPath = join(
  import.meta.dir,
  "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff"
);

const fontData = readFileSync(fontPath);

const pills = ["security", "encoding", "data", "generators", "time"];

const pillElements = pills.map((label) => ({
  type: "div",
  props: {
    style: {
      backgroundColor: "#313244",
      borderRadius: 4,
      padding: "4px 10px",
      fontSize: 12,
      color: "#6c7086",
      display: "flex",
    },
    children: label,
  },
}));

const files = [
  { name: "jwt-decoder.ts", active: false },
  { name: "json-formatter.ts", active: false },
  { name: "diff-tool.ts", active: true },
  { name: "hash-generator.ts", active: false },
  { name: "regex-tester.ts", active: false },
];

const fileRows = files.map((file) => ({
  type: "div",
  props: {
    style: {
      display: "flex",
      flexDirection: "row" as const,
      alignItems: "center",
      marginBottom: 12,
      fontSize: 13,
      fontFamily: "JetBrains Mono",
    },
    children: [
      {
        type: "span",
        props: {
          style: {
            color: file.active ? "#cba6f7" : "transparent",
            marginRight: 8,
            display: "flex",
          },
          children: "●",
        },
      },
      {
        type: "span",
        props: {
          style: {
            color: file.active ? "#cdd6f4" : "#6c7086",
            display: "flex",
          },
          children: file.name,
        },
      },
    ],
  },
}));

const tree = {
  type: "div",
  props: {
    style: {
      display: "flex",
      width: "1200px",
      height: "630px",
      backgroundColor: "#1e1e2e",
      position: "relative" as const,
      fontFamily: "JetBrains Mono",
    },
    children: [
      // LEFT SIDE
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column" as const,
            width: 720,
            padding: 60,
          },
          children: [
            // Spacer to push content down to ~y=200
            {
              type: "div",
              props: {
                style: { display: "flex", height: 80 },
                children: "",
              },
            },
            // Brand text
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#cdd6f4",
                  lineHeight: 1.1,
                },
                children: "unwrapped.tools",
              },
            },
            // Tagline
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  fontSize: 18,
                  color: "#6c7086",
                  marginTop: 20,
                },
                children: "Fast, local-first developer tools.",
              },
            },
            // Pills row
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "row" as const,
                  flexWrap: "wrap" as const,
                  gap: 8,
                  marginTop: 30,
                },
                children: pillElements,
              },
            },
          ],
        },
      },
      // RIGHT SIDE
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row" as const,
            width: 480,
            height: 630,
          },
          children: [
            // Accent strip
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  width: 4,
                  height: 630,
                  backgroundColor: "#cba6f7",
                },
                children: "",
              },
            },
            // Sidebar area
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column" as const,
                  flex: 1,
                  backgroundColor: "#181825",
                  padding: "60px 40px",
                },
                children: [
                  // Spacer to push files to ~y=200
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", height: 80 },
                      children: "",
                    },
                  },
                  // File rows
                  ...fileRows,
                ],
              },
            },
          ],
        },
      },
      // BOTTOM BAR
      {
        type: "div",
        props: {
          style: {
            position: "absolute" as const,
            bottom: 0,
            left: 0,
            width: 1200,
            height: 8,
            backgroundColor: "#cba6f7",
            display: "flex",
          },
          children: "",
        },
      },
    ],
  },
};

const svg = await satori(tree as Parameters<typeof satori>[0], {
  width: 1200,
  height: 630,
  fonts: [
    {
      name: "JetBrains Mono",
      data: fontData,
      weight: 700,
      style: "normal",
    },
  ],
});

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

const outPath = join(import.meta.dir, "../public/og-image.png");
writeFileSync(outPath, pngBuffer);
console.log("Generated public/og-image.png");
console.log(`File size: ${(pngBuffer.byteLength / 1024).toFixed(1)} KB`);
