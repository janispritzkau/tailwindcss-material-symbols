# Material Symbols for Tailwind CSS

Modern, variable Material Symbols as first‑class Tailwind utilities for both TailwindCSS v3 (plugin) and v4 (stand‑alone CSS utilities) with automatic font subsetting for production.

## Features

- Tailwind v3 plugin & Tailwind v4 native utility file
- Single `.icon` utility with composable variation classes (size / weight / fill / grade / family)
- Deterministic `icon-symbol-*` utilities for every Material Symbol
- Vite plugin that auto‑subsets variable fonts to only the symbols + variation axis ranges you actually use
- Optional (dev‑only) import of the full, un‑subsettled fonts for zero‑config local development

## Installation

```bash
pnpm add @janispritzkau/tailwindcss-material-symbols
# or
npm i @janispritzkau/tailwindcss-material-symbols
```

Peer deps: `tailwindcss` and (optionally) `vite` when using the Vite plugin.

## Available Utilities

- Family: `icon-outlined` (default), `icon-rounded`, `icon-sharp`
- Size: `icon-sm`, `icon-md` (default), `icon-lg`, `icon-xl`
- Weight: `icon-thin`, `icon-extralight`, `icon-light`, `icon-normal` (default), `icon-medium`, `icon-semibold`, `icon-bold`
- Fill: `icon-fill`, `icon-no-fill` (default)
- Grade: `icon-on-light` (0 / default), `icon-on-dark` (-25), `icon-high` (200)
- Symbol: `icon-symbol-<name>` (e.g. `icon-symbol-home`, `icon-symbol-search` …)

You can specify arbitrary icon sizes and line heights as follows: `icon-8`, `icon-sm/6`, or `icon-[1em]/[1lh]`. Note that arbitrary expressions don't automatically set the optical size; you can specify this separately via `icon-opsz-*`.

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

## Usage with TailwindCSS v4

For v4 you can skip the plugin and just import the provided utility layer:

```css
/* src/style.css */
@import "@janispritzkau/tailwindcss-material-symbols";
```

## Vite Plugin (Automatic Subsetting)

Add the plugin to your `vite.config.ts`. It will:

1. Collect the final CSS produced for the files you list in `include`
2. Detect which `icon-symbol-*` utilities and which variation axis values are used
3. Subset each variable font (outlined / rounded / sharp)
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

During dev (`vite serve`) the FULL fonts are injected. On build it performs real subsetting.

## Manual Full Font Import

If you are not using the Vite plugin, you can import the full, un‑subset fonts directly. Avoid this for production because the variable fonts are large.

```css
@import "@janispritzkau/tailwindcss-material-symbols/full.css";
```
