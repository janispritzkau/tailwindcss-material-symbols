import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { Plugin } from "vite";
import subsetMaterialSymbols from "./subset";

export interface MaterialSymbolsPluginOptions {
  include: string[];
}

export default function materialSymbols(options: MaterialSymbolsPluginOptions): Plugin[] {
  let collectedCss = "";
  let ids = new Map<string, () => void>();
  let collectPromise = Promise.resolve();
  let tempDir: string;

  return [
    {
      apply: "serve",
      enforce: "pre",
      name: "material-symbols-dev",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const css = `@import "@janispritzkau/tailwindcss-material-symbols/full.css";`;
          return { html, tags: [{ tag: "style", children: css, injectTo: "head" }] };
        },
      },
    },
    {
      name: "material-symbols",
      apply: "build",
      config(config) {
        // Create temp directory in node_modules
        tempDir = join(process.cwd(), "node_modules", ".cache", "material-symbols");
        if (!existsSync(tempDir)) {
          mkdirSync(tempDir, { recursive: true });
        }
      },
      async buildStart() {
        if (options.include) {
          for (const sourcePath of options.include) {
            const resolved = await this.resolve(sourcePath);
            if (resolved) {
              const promise = new Promise<void>((resolve) => ids.set(resolved.id, resolve));
              collectPromise = collectPromise.then(() => promise);
            } else {
              this.error(`Could not resolve ${sourcePath}`);
            }
          }
        }
      },
      resolveId(source) {
        if (source == "virtual:material-symbols.css") return "\0material-symbols.css";
      },
      async transform(code, id) {
        const resolve = ids.get(id);
        if (resolve) {
          collectedCss += code;
          ids.delete(id);
          resolve();
        }
      },
      async load(id) {
        if (id == "\0material-symbols.css") {
          await collectPromise;
          let css = "";
          const output = await subsetMaterialSymbols(collectedCss);
          for (const [variant, source] of Object.entries(output)) {
            // Write font to temporary directory
            const fontFileName = `material-symbols-${variant}.woff2`;
            const fontPath = join(tempDir, fontFileName);
            writeFileSync(fontPath, source);

            // Use relative path from project root
            const relativePath = join("node_modules", ".cache", "material-symbols", fontFileName);
            const fontUrl = `/${relativePath}`;

            css += `@font-face {
  font-family: "Material Symbols ${variant.replace(/^./, (c) => c.toUpperCase())}";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url("${fontUrl}") format("woff2");
}\n`;
          }
          return css;
        }
      },
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          return {
            html,
            tags: [
              {
                tag: "script",
                attrs: { type: "module" },
                children: `import "virtual:material-symbols.css";`,
                injectTo: "head",
              },
            ],
          };
        },
      },
    },
  ];
}
