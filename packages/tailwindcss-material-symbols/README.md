# Material Symbols for TailwindCSS

## Importing fonts manually

```css
@import "@janispritzkau/tailwindcss-material-symbols/outlined.css";
@import "@janispritzkau/tailwindcss-material-symbols/rounded.css";
@import "@janispritzkau/tailwindcss-material-symbols/sharp.css";
```

## Importing fonts using the vite plugin

```ts
import { defineConfig } from "vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [materialSymbols()],
});
```

This will automatically detect and import the correct fonts.

## Usage in TailwindCSS v4

```css
@import "tailwindcss";
@import "@janispritzkau/tailwindcss-material-symbols";
```

## Usage in TailwindCSS v4

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols";

export default {
  content: ["./src/**/*.{ts,vue}", "./index.html"],
  plugins: [materialSymbols],
} satisfies Config;
```
