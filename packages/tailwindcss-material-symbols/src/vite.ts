import type { Plugin } from "vite";
import subsetMaterialSymbols from "./subset";

export default function materialSymbols(): Plugin[] {
  let inlineLimit: number;

  return [
    {
      apply: "serve",
      enforce: "pre",
      name: "@janispritzkau/tailwindcss-material-symbols/vite:serve",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const css = `@import "@janispritzkau/tailwindcss-material-symbols/full.css";`;
          return { html, tags: [{ tag: "style", children: css, injectTo: "head" }] };
        },
      },
    },
    {
      name: "@janispritzkau/tailwindcss-material-symbols/vite:build",
      apply: "build",
      async configResolved(config) {
        if (typeof config.build.assetsInlineLimit === "number") {
          inlineLimit = config.build.assetsInlineLimit;
        }
      },
      async transform(code, id) {
        if (!/\.css(\?inline|\?transform-only)?$/.test(id)) return;

        let output = "";
        for (const font of await subsetMaterialSymbols(code)) {
          let fontSrc: string;
          if (font.source.length <= inlineLimit) {
            const base64 = font.source.toString("base64");
            fontSrc = `data:font/woff2;base64,${base64}`;
          } else {
            const ref = this.emitFile({
              type: "asset",
              name: font.fileName,
              source: font.source,
            });
            fontSrc = `__VITE_ASSET__${ref}__`;
          }

          output += `@font-face {
  font-family: "${font.fontFamily}";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url("${fontSrc}") format("woff2");
}\n`;
        }

        output += code;
        return { code: output, map: null };
      },
    },
  ];
}
