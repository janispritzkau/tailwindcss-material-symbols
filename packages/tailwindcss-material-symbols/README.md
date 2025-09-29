# @janispritzkau/tailwindcss-material-symbols

Modern, variable Material Symbols as first‑class Tailwind utilities for both TailwindCSS v3 (plugin) and v4 (stand‑alone CSS utilities) with automatic font subsetting for production.

## Features

- Tailwind v3 plugin & Tailwind v4 native utility file
- Single `.icon` utility with composable variation classes (size / weight / fill / grade / family)
- Deterministic `icon-symbol-*` utilities for every Material Symbol
- Vite plugin that auto‑subsets variable fonts to only the symbols + variation axis ranges you actually use
- Optional (dev‑only) import of the full, un‑subsettled fonts for zero‑config local development
- Planned CLI to subset fonts for any build tool (see CLI section)

## Installation

```bash
pnpm add @janispritzkau/tailwindcss-material-symbols
# or
npm i @janispritzkau/tailwindcss-material-symbols
```

Peer deps: `tailwindcss` (^3.4 / ^4.1) and (optionally) `vite` when using the Vite plugin.

## Usage with TailwindCSS v3

1. Enable the plugin in `tailwind.config.(js|ts)`

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols";

export default {
  content: ["./src/**/*.{js,ts,vue,jsx,tsx}", "./index.html"],
  plugins: [materialSymbols],
} satisfies Config;
```

2. Use the utilities:

```html
<span class="icon icon-symbol-home"></span>
<span class="icon icon-symbol-home icon-rounded icon-bold"></span>
<span class="icon icon-symbol-search icon-sm icon-fill"></span>
```

### Available variation utilities (v3)

- Family: `icon-outlined` (default), `icon-rounded`, `icon-sharp`
- Size: `icon-sm`, `icon-md` (default), `icon-lg`, `icon-xl`
- Weight: `icon-thin`, `icon-extralight`, `icon-light`, `icon-normal` (default), `icon-medium`, `icon-semibold`, `icon-bold`
- Fill: `icon-fill` (sets fill=1), omit for outline (0)
- Grade: `icon-on-light` (0 / default), `icon-on-dark` (-25), `icon-high` (200)
- Symbol: `icon-symbol-<name>` (e.g. `icon-symbol-home`, `icon-symbol-search` …)

Each class only adjusts a single axis via CSS custom properties, so you can combine freely.

## Usage with TailwindCSS v4

For v4 you can skip the plugin and just import the provided utility layer (built with the new `@theme` / `@utility` syntax):

```css
/* src/style.css */
@import "@janispritzkau/tailwindcss-material-symbols";
```

Then reference classes exactly like in v3 (the API is intentionally the same).

Alternatively you can still register the plugin (it works in v4) if you prefer a JS‑driven configuration approach or want to customize defaults through Tailwind’s theme extension APIs.

## Vite Plugin (Automatic Subsetting)

Add the plugin to your `vite.config.ts`. It will:

1. Collect the final CSS produced for the files you list in `include`
2. Detect which `icon-symbol-*` utilities and which variation axis values are used
3. Subset (and range‑trim) each variable font (outlined / rounded / sharp)
4. Emit only the required glyphs + axis min/max as optimized `woff2` assets
5. Inject the necessary `@font-face` declarations

```ts
// vite.config.ts
import { defineConfig } from "vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

export default defineConfig({
  plugins: [
    materialSymbols({
      // List the CSS modules whose output should be scanned
      include: ["src/style.css"],
    }),
  ],
});
```

During dev (`vite serve`) the FULL fonts are injected for instant feedback (no waiting for subsetting). On build it performs real subsetting.

---

## Manual Full Font Import (Dev Only)

If you are not using the Vite plugin (or want absolute simplicity in development), you can import the full, un‑subset fonts directly. Avoid this for production because the variable fonts are large.

```css
@import "@janispritzkau/tailwindcss-material-symbols/full.css";
```

Use alongside either the v3 plugin or the v4 utility import.

## Planned CLI (Cross‑tooling Subsetting)

For non‑Vite builds (Webpack, esbuild, Rollup, Next.js custom, static pipelines) a CLI will let you subset after your CSS is generated:

```bash
npx tailwindcss-material-symbols subset --output dist/assets build/style.css
```

Behavior (planned):

1. Reads one or more CSS files (last arg(s))
2. Extracts used symbol names & axis values (same logic as the Vite plugin)
3. Emits minimal `material-symbols-{outlined|rounded|sharp}.woff2` to `--output`
4. Prints suggested `@font-face` block (or optionally writes a `.css` file)
5. Exits non‑zero if no symbols were found (to catch misconfigurations)

> Status: Not implemented yet. API subject to change before first stable release.

## Customization

Tailwind v3 (plugin): override theme defaults in your `tailwind.config.*` under the `icon` key (font families, size map with `fontSize` + `opsz`, weight steps, grade, fill).

Tailwind v4 (CSS): you can post‑process the imported CSS or write your own additional utilities that set the same custom properties (`--icon-wght`, `--icon-fill`, etc.).

## License

MIT. Material Symbols are (c) Google – see upstream licensing; this package redistributes only subsetted / referenced font binaries for convenience.
