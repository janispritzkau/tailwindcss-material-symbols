import type { Plugin } from "vite";
import subsetMaterialSymbols from "./subset";

/**
 * Vite plugin that subsets Material Symbols fonts based on actually used icons
 * & font-variation settings found inside the final CSS bundle.
 *
 * Build-only: we skip subsetting during dev (serve) to keep fast HMR.
 */
export interface MaterialSymbolsPluginOptions {
  /** Force always subsetting, even in dev */
  subsetInDev?: boolean;
  /** Force always serving full fonts (disables subsetting) */
  fullInProd?: boolean;
  /** Override font family names */
  familyNames?: Partial<Record<"outlined" | "rounded" | "sharp", string>>;
}

export default function materialSymbols(options: MaterialSymbolsPluginOptions = {}): Plugin {
  // Raw CSS collected during transform (may not include post-processed outputs)
  const collectedCss: string[] = [];
  // Track emitted font ids -> variant
  const emittedFontIds: Array<{ id: string; variant: "outlined" | "rounded" | "sharp" }> = [];

  const familyNames: Record<"outlined" | "rounded" | "sharp", string> = {
    outlined: "Material Symbols Outlined",
    rounded: "Material Symbols Rounded",
    sharp: "Material Symbols Sharp",
    ...options.familyNames,
  } as const;

  let isDev = false;
  const devPublicPath = "/material-symbols"; // base path to serve raw fonts in dev
  const fontFileNames: Record<"outlined" | "rounded" | "sharp", string> = {
    outlined: "material-symbols-outlined.woff2",
    rounded: "material-symbols-rounded.woff2",
    sharp: "material-symbols-sharp.woff2",
  };

  return {
    name: "subset-material-symbols",
    enforce: "post",
    // We need both serve & build (different behavior)
    apply: () => true,
    configResolved(cfg) {
      isDev = cfg.command === "serve";
    },
    configureServer(server) {
      // Serve raw full fonts from the installed package assets directory during dev.
      // We resolve relative to this file's location (../../assets)
      if (!isDev) return;
      const { readFileSync } = require("fs");
      const { fileURLToPath } = require("url");
      const { resolve } = require("path");
      const assetsDir = resolve(fileURLToPath(new URL("../assets/", import.meta.url)));
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith(devPublicPath + "/")) return next();
        const file = req.url.slice(devPublicPath.length + 1);
        const variant = Object.entries(fontFileNames).find(([, fname]) => fname === file);
        if (!variant) return next();
        try {
          const abs = resolve(assetsDir, file);
          const data = readFileSync(abs);
          res.setHeader("Content-Type", "font/woff2");
          res.end(data);
        } catch {
          next();
        }
      });
    },
    buildStart() {
      collectedCss.length = 0;
      emittedFontIds.length = 0;
    },
    transform(code, id) {
      if (!isDev && id.endsWith(".css")) {
        collectedCss.push(code);
      }
      return null;
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // Dev mode full fonts injection (unless we subset in dev explicitly)
        if (isDev && !options.subsetInDev) {
          const faces = [
            ["outlined", familyNames.outlined],
            ["rounded", familyNames.rounded],
            ["sharp", familyNames.sharp],
          ] as const;
          let css = "";
          for (const [variant, fam] of faces) {
            css += `@font-face {\n`;
            css += `  font-family: '${fam}';\n`;
            css += `  font-style: normal;\n`;
            css += `  font-weight: 100 700;\n`;
            css += `  font-display: swap;\n`;
            css += `  src: url('${devPublicPath}/${fontFileNames[variant]}') format('woff2');\n`;
            css += `}\n`;
          }
          const tag = { tag: "style", injectTo: "head" as const, children: css };
          return { html, tags: [tag] };
        }
        return html;
      },
    },
    async generateBundle(_options, bundle) {
      if (isDev && !options.subsetInDev) return; // skip subsetting in dev unless forced
      if (options.fullInProd) return; // user opted out of subsetting in prod
      // Collect the final CSS from the bundle as well (post Tailwind / PostCSS)
      const finalCss = Object.values(bundle)
        .filter(
          (a) => a.type === "asset" && typeof a.source === "string" && a.fileName.endsWith(".css"),
        )
        .map((a: any) => a.source as string)
        .concat(collectedCss)
        .join("\n");

      const subsetOutput = await subsetMaterialSymbols(finalCss);

      // Emit subset font assets with a stable path (can be hashed later if desired)
      for (const [variant, buffer] of Object.entries(subsetOutput)) {
        if (!buffer) continue;
        const id = this.emitFile({
          type: "asset",
          name: `material-symbols-${variant}.woff2`,
          source: buffer,
        });
        emittedFontIds.push({ id, variant: variant as (typeof emittedFontIds)[number]["variant"] });
      }

      if (emittedFontIds.length === 0) return;

      // Build @font-face CSS referencing the emitted (possibly hashed) file names
      let fontCss = "";
      for (const { id, variant } of emittedFontIds) {
        const fileName = this.getFileName(id);
        fontCss += `@font-face {\n`;
        fontCss += `  font-family: '${familyNames[variant]}';\n`;
        fontCss += `  font-style: normal;\n`;
        fontCss += `  font-weight: 100 700;\n`;
        fontCss += `  font-display: swap;\n`;
        fontCss += `  src: url('${fileName}') format('woff2');\n`;
        fontCss += `}\n`;
      }

      // Emit CSS asset with subset faces and rely on import (user can import or we can inject here)
      const cssAssetId = this.emitFile({
        type: "asset",
        name: "material-symbols.css",
        source: fontCss,
      });
      const subsetCssFile = this.getFileName(cssAssetId);

      // Attempt injection if index.html exists
      const indexHtml = Object.values(bundle).find(
        (a: any) =>
          a.type === "asset" && a.fileName === "index.html" && typeof a.source === "string",
      );
      if (indexHtml && typeof (indexHtml as any).source === "string") {
        const asset = indexHtml as any;
        const htmlSource: string = asset.source;
        const linkTag = `<link rel="stylesheet" href="${subsetCssFile}" />`;
        asset.source = /<\/head>/i.test(htmlSource)
          ? htmlSource.replace(/<\/head>/i, `${linkTag}\n</head>`)
          : linkTag + "\n" + htmlSource;
      }
    },
  };
}
