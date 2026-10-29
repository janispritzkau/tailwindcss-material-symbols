import { createRequire } from "node:module";
import type { Plugin, ResolvedConfig } from "vite";
import { fontFace } from "./font-face";
import {
  detectWithChars,
  subsetDetected,
  type DetectionWithChars,
  type SubsetFont,
} from "./subset";

export interface MaterialSymbolsPluginOptions {
  /** @deprecated Ignored. The plugin finds the stylesheets that use icons by itself. */
  include?: string[];
}

// CSS modules, including `?inline`, `?direct` and the style blocks of Vue SFCs (`&lang.css`). Like
// in Vite, preprocessor languages are included: the transform sees them after compilation to CSS.
const CSS_RE = /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
const NOT_CSS_QUERY_RE = /[?&](?:url|raw|worker|sharedworker)(?:$|&|=)/;

const DEFAULT_INLINE_LIMIT = 4096;

const require = createRequire(import.meta.url);

function isCss(id: string): boolean {
  return CSS_RE.test(id) && !NOT_CSS_QUERY_RE.test(id);
}

/** Detects the icon usage in a CSS module, or returns `undefined` if it uses no symbols. */
function detectUsage(code: string): DetectionWithChars | undefined {
  if (!code.includes("--icon-")) return;
  const detection = detectWithChars(code);
  return detection.symbols.size > 0 ? detection : undefined;
}

// Subsets by detection result, so CSS modules with the same icon usage share the work, also
// across environments and watch rebuilds. The key uses the characters, not the symbol names, which
// a theme can map to other characters.
const subsets = new Map<string, Promise<SubsetFont[]>>();
const MAX_CACHED_SUBSETS = 64;

function subsetCached(detection: DetectionWithChars): Promise<SubsetFont[]> {
  const key = JSON.stringify({
    ...detection,
    symbols: Array.from(new Set(detection.symbols.values())).sort(),
  });
  let fonts = subsets.get(key);
  if (!fonts) {
    fonts = subsetDetected(detection);
    fonts.catch(() => subsets.delete(key));
    if (subsets.size >= MAX_CACHED_SUBSETS) subsets.delete(subsets.keys().next().value!);
    subsets.set(key, fonts);
  }
  return fonts;
}

// Like Vite's asset handling: always inline in library mode, otherwise below `assetsInlineLimit`.
// A function limit gets the font's file name, as there is no source path.
function shouldInline(config: ResolvedConfig, font: SubsetFont): boolean {
  if (config.build.lib) return true;
  const limit = config.build.assetsInlineLimit;
  if (typeof limit === "function") {
    const result = limit(font.fileName, font.source);
    if (result != null) return result;
  }
  return font.source.length < (typeof limit === "number" ? limit : DEFAULT_INLINE_LIMIT);
}

/**
 * Adds `@font-face` rules for Material Symbols to every CSS module that uses icons: the full fonts
 * on the dev server, and fonts subsetted to the module's symbols and axis ranges in builds.
 */
export default function materialSymbols(options?: MaterialSymbolsPluginOptions): Plugin[] {
  let config: ResolvedConfig;

  function configResolved(resolved: ResolvedConfig) {
    config = resolved;
    if (options?.include) {
      config.logger.warn(
        "[material-symbols] The `include` option is deprecated and ignored. The plugin now finds the stylesheets that use icons by itself.",
      );
    }
  }

  return [
    {
      name: "material-symbols:serve",
      apply: "serve",
      configResolved,
      transform(code, id) {
        if (!isCss(id)) return;
        const detection = detectUsage(code);
        if (!detection) return;

        let css = "";
        for (const font of detection.fonts) {
          const path = require.resolve(`material-symbols/material-symbols-${font}.woff2`);
          const url = `${config.base}@fs/${encodeURI(path.replaceAll("\\", "/").replace(/^\//, ""))}`;
          css += fontFace(detection.fontFamily[font], url);
        }
        // Appended, so that `@charset` and `@import` stay first and existing source maps stay valid.
        return { code: `${code}\n${css}`, map: null };
      },
    },
    {
      name: "material-symbols:build",
      apply: "build",
      configResolved,
      async transform(code, id) {
        if (!isCss(id)) return;
        const detection = detectUsage(code);
        if (!detection) return;

        let css = "";
        for (const font of await subsetCached(detection)) {
          let url: string;
          if (shouldInline(config, font)) {
            url = `data:font/woff2;base64,${font.source.toString("base64")}`;
          } else {
            const ref = this.emitFile({ type: "asset", name: font.fileName, source: font.source });
            url = `__VITE_ASSET__${ref}__`;
          }
          css += fontFace(font.fontFamily, url);
        }
        return { code: `${code}\n${css}`, map: null };
      },
    },
  ];
}
