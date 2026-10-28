import type { Plugin } from "vite";
import subsetMaterialSymbols from "./subset";

export interface MaterialSymbolsPluginOptions {
  include: string[];
}

export default function materialSymbols(options: MaterialSymbolsPluginOptions): Plugin[] {
  let includeIds: string[] = [];
  const cssById = new Map<string, string>();

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
      async buildStart() {
        includeIds = [];
        if (options.include) {
          for (const sourcePath of options.include) {
            const resolved = await this.resolve(sourcePath);
            if (resolved) {
              includeIds.push(resolved.id);
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
        if (includeIds.includes(id)) cssById.set(id, code);
      },
      async load(id) {
        if (id == "\0material-symbols.css") {
          // Wait for the included stylesheets to be transformed. This also loads them if nothing
          // imports them, and reuses the cached CSS when watch mode skips their transform.
          await Promise.all(includeIds.map((id) => this.load({ id })));
          const collectedCss = includeIds.map((id) => cssById.get(id) ?? "").join("\n");
          let css = "";
          const output = await subsetMaterialSymbols(collectedCss);
          for (const [variant, source] of Object.entries(output)) {
            const ref = this.emitFile({
              type: "asset",
              name: `material-symbols-${variant}.woff2`,
              source,
            });
            css += `@font-face {
  font-family: "Material Symbols ${variant.replace(/^./, (c) => c.toUpperCase())}";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url("__VITE_ASSET__${ref}__") format("woff2");
}\n`;
          }
          return css;
        }
      },
      config() {
        return {
          css: {},
        };
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
