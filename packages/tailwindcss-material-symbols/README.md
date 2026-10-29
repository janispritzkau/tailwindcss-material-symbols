# Material Symbols for Tailwind CSS

[Material Symbols](https://fonts.google.com/icons) as Tailwind CSS utilities, with font subsetting for production builds.

```html
<span class="icon icon-symbol-home"></span>
<span class="icon icon-symbol-favorite icon-rounded icon-fill icon-lg text-red-500"></span>
```

- Works with Tailwind CSS v4 (CSS import) and v3 (plugin, [deprecated](#tailwind-css-v3-deprecated)).
- One `icon-symbol-*` utility for every Material Symbol.
- Utilities for the font's variable axes: fill, weight, grade, and optical size. They compose with any Tailwind variant (`hover:`, `dark:`, `group-hover:`, `before:`, …).
- The Vite plugin uses the full fonts in development. For production builds it subsets them to the symbols and axis ranges your CSS uses, so you ship a few KB instead of several MB. It needs no options and no `index.html`.
- A CLI and a Node API do the same subsetting outside Vite.

## Contents

- [Installation](#installation)
- [Setup](#setup)
  - [Tailwind CSS v4](#tailwind-css-v4)
  - [Tailwind CSS v3 (deprecated)](#tailwind-css-v3-deprecated)
  - [Loading the fonts](#loading-the-fonts)
- [Usage](#usage)
- [Utility reference](#utility-reference)
- [Customization](#customization)
- [Vite plugin](#vite-plugin)
- [CLI](#cli)
- [Node API](#node-api)
- [Limitations](#limitations)

## Installation

```bash
npm install -D @janispritzkau/tailwindcss-material-symbols
# or
pnpm add -D @janispritzkau/tailwindcss-material-symbols
```

Peer dependencies: `tailwindcss` (`^3.4.17` or `^4.1.13`). `vite` (`^7.1.7` or `^8.0.0`) is only needed for the Vite plugin.

## Setup

### Tailwind CSS v4

Import the utilities after Tailwind in your main stylesheet:

```css
/* src/style.css */
@import "tailwindcss";
@import "@janispritzkau/tailwindcss-material-symbols";
```

### Tailwind CSS v3 (deprecated)

> [!WARNING]
> Tailwind CSS v3 support is deprecated and will be removed in a future minor version. It still works, but new features target Tailwind CSS v4 only.

Add the plugin to your Tailwind config:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/v3";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  plugins: [materialSymbols],
} satisfies Config;
```

The plugin is also the default export of `@janispritzkau/tailwindcss-material-symbols` in Node, so existing configs keep working. It adds one rule to the base layer, so your CSS needs `@tailwind base`.

### Loading the fonts

The utilities only reference the font families `Material Symbols Outlined`, `Material Symbols Rounded`, and `Material Symbols Sharp`. You also need to load the fonts. Pick one of these options:

- **Vite (recommended):** add the [Vite plugin](#vite-plugin). It serves the full fonts during development and emits subsetted fonts at build time.
- **Other build tools:** run the [CLI](#cli) on your compiled CSS to generate subsetted fonts and a matching `@font-face` stylesheet.
- **Full fonts:** import the bundled, unsubsetted variable fonts. This is the simplest option, but each font is 3.5–5.5 MB, so avoid it in production.

  ```css
  @import "@janispritzkau/tailwindcss-material-symbols/full.css"; /* all three styles */
  @import "@janispritzkau/tailwindcss-material-symbols/outlined.css"; /* or only one */
  @import "@janispritzkau/tailwindcss-material-symbols/rounded.css";
  @import "@janispritzkau/tailwindcss-material-symbols/sharp.css";
  ```

## Usage

Every icon needs the `icon` base class and an `icon-symbol-<name>` class. Symbol names are the snake_case names from [Google Fonts](https://fonts.google.com/icons), for example `arrow_forward`, `10k`, or `check_circle`.

```html
<span class="icon icon-symbol-arrow_forward"></span>
```

The icon is rendered through a `::before` pseudo-element, so the element itself stays empty. It inherits `color` like text does, so color utilities such as `text-blue-600` apply directly.

For decorative icons, add `aria-hidden="true"` so screen readers skip them.

### Style, fill, weight, and grade

```html
<!-- Style (font family) -->
<span class="icon icon-symbol-home icon-rounded"></span>
<span class="icon icon-symbol-home icon-sharp"></span>

<!-- Filled -->
<span class="icon icon-symbol-favorite icon-fill"></span>

<!-- Weight -->
<span class="icon icon-symbol-search icon-thin"></span>
<span class="icon icon-symbol-search icon-bold"></span>

<!-- Grade: use icon-on-dark for light icons on a dark background -->
<span class="icon icon-symbol-settings icon-on-dark"></span>
```

### Size and optical size

The named sizes set both the font size and the matching optical size (`opsz`):

| Class     | Font size      | Optical size |
| --------- | -------------- | ------------ |
| `icon-sm` | 1.25rem (20px) | 20           |
| `icon-md` | 1.5rem (24px)  | 24 (default) |
| `icon-lg` | 2.5rem (40px)  | 40           |
| `icon-xl` | 3rem (48px)    | 48           |

```html
<span class="icon icon-symbol-star icon-lg"></span>
```

Numeric sizes use your spacing scale. `icon-<n>` sets the font size to the spacing value `<n>` and the optical size to `<n> × 4`, which is the pixel size at the default 16px root font size. For example, `icon-8` is 2rem with optical size 32:

```html
<span class="icon icon-symbol-star icon-8"></span>
```

The font supports optical sizes 20–48. The browser clamps values outside that range.

Arbitrary sizes set only the font size. Use `icon-opsz-*` to choose an optical size:

```html
<span class="icon icon-symbol-star icon-[4em] icon-opsz-xl"></span>
```

### Line height

The `icon` class sets `line-height: 1`. Add a line-height modifier to any size utility to align an icon with surrounding text:

```html
<p class="text-sm">
  <span class="icon icon-symbol-person icon-sm/5 align-top"></span>
  Profile
</p>

<span class="icon icon-symbol-add icon-md/[1lh]"></span>
```

### Variants

The axis utilities only set CSS custom properties, so they work with any variant:

```html
<button class="group">
  <span
    class="icon icon-symbol-bookmark hover:icon-fill group-hover:icon-bold dark:icon-on-dark"
  ></span>
</button>
```

### Icons in pseudo-elements

The `before:` and `after:` variants add an icon without an extra element:

```html
<a class="after:icon after:icon-symbol-open_in_new after:icon-sm/[1lh] after:align-top">Docs</a>
```

## Utility reference

| Utility                                                                                                            | Effect                                                                         |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `icon`                                                                                                             | Base icon styles. Renders the selected symbol in `::before`.                   |
| `icon-symbol-<name>`                                                                                               | Selects the symbol.                                                            |
| `icon-outlined` (default), `icon-rounded`, `icon-sharp`                                                            | Font family / style.                                                           |
| `icon-sm`, `icon-md` (default), `icon-lg`, `icon-xl`                                                               | Font size 20 / 24 / 40 / 48px and the matching optical size.                   |
| `icon-<n>`                                                                                                         | Font size from the spacing scale, optical size `<n> × 4`.                      |
| `icon-[<length>]`                                                                                                  | Arbitrary font size, optical size unchanged.                                   |
| `icon-<size>/<line-height>`                                                                                        | Any size utility above with a line height (e.g. `icon-sm/5`, `icon-md/[1lh]`). |
| `icon-opsz-sm`, `icon-opsz-md`, `icon-opsz-lg`, `icon-opsz-xl`                                                     | Optical size 20 / 24 / 40 / 48 without changing the font size.                 |
| `icon-thin`, `icon-extralight`, `icon-light`, `icon-normal` (default), `icon-medium`, `icon-semibold`, `icon-bold` | Weight 100–700.                                                                |
| `icon-no-fill` (default), `icon-fill`                                                                              | Fill 0 / 1.                                                                    |
| `icon-on-light` (default), `icon-on-dark`, `icon-high`                                                             | Grade 0 / -25 / 200.                                                           |

## Customization

### Tailwind CSS v4

All values are theme variables. Override or add them in your own `@theme` block:

```css
@import "tailwindcss";
@import "@janispritzkau/tailwindcss-material-symbols";

@theme {
  /* Change the defaults applied by `icon` */
  --default-icon-font: var(--icon-font-rounded);
  --default-icon-wght: var(--icon-wght-light);

  /* Add a size: enables `icon-2xl` and `icon-opsz-2xl` */
  --icon-size-2xl: --spacing(16);
  --icon-opsz-2xl: 48;
}
```

| Namespace          | Keys                                                                  | Used by                           |
| ------------------ | --------------------------------------------------------------------- | --------------------------------- |
| `--icon-font-*`    | `outlined`, `rounded`, `sharp`                                        | `icon-<font>`                     |
| `--icon-size-*`    | `sm`, `md`, `lg`, `xl`                                                | `icon-<size>` (font size)         |
| `--icon-opsz-*`    | `sm`, `md`, `lg`, `xl`                                                | `icon-<size>`, `icon-opsz-<size>` |
| `--icon-wght-*`    | `thin`, `extralight`, `light`, `normal`, `medium`, `semibold`, `bold` | `icon-<weight>`                   |
| `--icon-fill-*`    | `fill`, `no-fill`                                                     | `icon-fill`, `icon-no-fill`       |
| `--icon-grad-*`    | `on-light`, `on-dark`, `high`                                         | `icon-<grade>`                    |
| `--default-icon-*` | `font`, `size`, `opsz`, `wght`, `fill`, `grad`                        | `icon`                            |

### Tailwind CSS v3 (deprecated)

The plugin reads the `icon` theme key. Each group has a `DEFAULT` entry that `icon` uses:

```ts
// tailwind.config.ts
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      icon: {
        size: { "2xl": { fontSize: "4rem", opsz: "48" } }, // icon-2xl, icon-opsz-2xl
        wght: { DEFAULT: "300" },
      },
    },
  },
  plugins: [materialSymbols],
} satisfies Config;
```

The groups are `font`, `size` (objects with `fontSize` and `opsz`), `wght`, `fill`, and `grad`. See the plugin source for the default values.

## Vite plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

export default defineConfig({
  plugins: [tailwindcss(), materialSymbols()],
});
```

With Tailwind v3, add the plugin the same way and leave out `@tailwindcss/vite`. Tailwind runs through PostCSS in that case.

The plugin has no options. The `include` option of earlier versions is deprecated and ignored.

**How it works**

The plugin adds `@font-face` rules to every CSS module that uses icons, including `?inline` imports. It doesn't need an `index.html`, so it also works with frameworks that render their own HTML, such as SvelteKit.

- **`vite` (dev server):** the rules load the full fonts, so every symbol and axis value works without a restart.
- **`vite build`:** the plugin finds the `icon-symbol-*` symbols, font styles, and axis values in the module's CSS and subsets each used font style to them. Fonts below `build.assetsInlineLimit` are inlined as `data:` URLs, larger ones are emitted as `material-symbols-<style>.woff2` assets. Each stylesheet gets its own subsets, so code-split CSS only loads the glyphs it uses.

**Shadow DOM:** browsers only use the document's fonts inside a shadow root, and ignore `@font-face` rules in the shadow root's own stylesheets. If a shadow root has its own stylesheet (for example from `?inline`), make sure that a stylesheet in the document uses the same symbols, for example by letting Tailwind scan the shadow root's source files there as well (`@source`).

## CLI

The `tailwindcss-material-symbols` command subsets the fonts based on compiled Tailwind CSS. Use it with the Tailwind CLI, PostCSS, or any other build tool:

```bash
npx tailwindcss-material-symbols subset dist/style.css --outDir dist/fonts
```

```
tailwindcss-material-symbols subset [...input] [--outDir <dir>]
```

- `input`: one or more compiled CSS files. If no files are given, the CSS is read from stdin.
- `--outDir`: output directory (default: `dist`).

It writes `material-symbols-<style>.woff2` for each used font style, plus a `material-symbols.css` with `@font-face` rules that reference the fonts by relative URL. Load that stylesheet in your page next to your compiled CSS.

## Node API

```ts
import { readFile, writeFile } from "node:fs/promises";
import subsetMaterialSymbols from "@janispritzkau/tailwindcss-material-symbols/subset";

const css = await readFile("dist/style.css", "utf-8");
const fonts = await subsetMaterialSymbols(css);
// => [{ fontFamily: "Material Symbols Outlined", fileName: "material-symbols-outlined.woff2", source: Buffer }, …] (woff2)

for (const font of fonts) {
  await writeFile(`dist/${font.fileName}`, font.source);
}
```

`subsetMaterialSymbols(css, options?)` accepts these options:

| Option       | Type                                                                                                        | Description                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `fontFamily` | `{ outlined, rounded, sharp }` (font family names)                                                          | Font family names to look for, if you renamed them in your theme.                                     |
| `defaults`   | `{ font?: "outlined" \| "rounded" \| "sharp"; opsz?: number; wght?: number; grad?: number; fill?: number }` | Values that are always included, matching the defaults of `icon`. Default: `outlined`, 24, 400, 0, 0. |

Unlike the CLI, the API doesn't write files or generate `@font-face` rules.

## Limitations

- **No ligatures:** select symbols with `icon-symbol-*` classes. Ligature text such as `<span class="icon">home</span>` renders with the full fonts, but not with subsetted fonts, which contain only the glyphs of the `icon-symbol-*` classes in your CSS.

## License

MIT. The Material Symbols fonts are by Google and licensed under the [Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE). They are installed from the [`material-symbols`](https://www.npmjs.com/package/material-symbols) package, which includes the license.
