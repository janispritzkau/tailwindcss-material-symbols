# Material Symbols for Tailwind CSS

[Material Symbols](https://fonts.google.com/icons) as Tailwind CSS utilities. The fonts are **self-hosted**, so nothing is loaded from Google's CDN (privacy, GDPR). In production builds they are **subsetted automatically** to the symbols and axis ranges your CSS uses, so you ship a few KB instead of several MB. Symbols are **classes, not ligature text**: there is no flash of the word "star" before the font loads, and the subset can drop everything else.

```html
<span class="icon icon-symbol-home"></span>
<span class="icon icon-symbol-favorite icon-rounded icon-fill icon-lg text-red-500"></span>
```

## Installation

```bash
npm install -D @janispritzkau/tailwindcss-material-symbols
```

Peer dependencies: `tailwindcss` (`^4.1.13`, or `^3.4.17` [deprecated](#tailwind-css-v3-deprecated)) and, for the Vite plugin, `vite` (`^7.1.7 || ^8.0.0`).

## Setup

Import the utilities after Tailwind in your stylesheet and add the Vite plugin. The plugin has no options (the old `include` option is ignored) and needs no `index.html`.

```css
/* src/style.css */
@import "tailwindcss";
@import "@janispritzkau/tailwindcss-material-symbols";
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

export default defineConfig({
  plugins: [tailwindcss(), materialSymbols()],
});
```

The plugin adds `@font-face` rules to every CSS module that uses icons: the full fonts on the dev server, subsets in `vite build`. It also works with SvelteKit. Nuxt, Astro and React Router haven't been tested.

- **CSP:** builds inline fonts below `build.assetsInlineLimit` (4 KB by default, always in library mode) as `data:` URLs. Allow `data:` in `font-src`, or set `assetsInlineLimit: 0`.
- **Shadow DOM:** browsers only use the document's fonts inside a shadow root. A document stylesheet must use the shadow root's symbols too. Tailwind finds them if the markup is in your project; otherwise add `@source "./path/to/files";`. See [`examples/vite`](https://github.com/janispritzkau/tailwindcss-material-symbols/tree/main/examples/vite).
- **Watch mode:** Tailwind v4 keeps classes in its CSS after you remove them from a file, so the subset keeps them until you restart.

## Usage

Every icon needs `icon` and an `icon-symbol-<name>` class, with the snake_case names from [Google Fonts](https://fonts.google.com/icons). The icon is drawn in `::before`, inherits `color`, and works with any variant. Add `aria-hidden="true"` to decorative icons.

```html
<span class="icon icon-symbol-arrow_forward icon-sharp icon-bold icon-lg"></span>

<!-- With variants and transitions -->
<button class="group">
  <span
    class="icon icon-symbol-bookmark transition-[font-variation-settings] hover:icon-fill group-hover:icon-bold dark:icon-on-dark"
  ></span>
</button>

<!-- Size with line height, aligned to text -->
<p class="text-sm">
  <span class="icon icon-symbol-person icon-sm/5 align-top"></span>
  Profile
</p>

<!-- Without an extra element -->
<a class="after:icon after:icon-symbol-open_in_new after:icon-sm/[1lh] after:align-top">Docs</a>
```

| Utility                                                                                                            | Effect                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `icon`                                                                                                             | Base styles. Renders the selected symbol in `::before`.                                                        |
| `icon-symbol-<name>`                                                                                               | Selects the symbol.                                                                                            |
| `icon-outlined` (default), `icon-rounded`, `icon-sharp`                                                            | Style (font family).                                                                                           |
| `icon-sm`, `icon-md` (default), `icon-lg`, `icon-xl`                                                               | Font size 20 / 24 / 40 / 48px and the matching optical size.                                                   |
| `icon-<n>`, `icon-[<length>]`                                                                                      | Font size from the spacing scale (optical size `<n> × 4`), or any length (optical size unchanged).             |
| `icon-<size>/<line-height>`                                                                                        | Line height for any size utility, for example `icon-sm/5` or `icon-md/[1lh]`. The default is `line-height: 1`. |
| `icon-opsz-sm`, `icon-opsz-md`, `icon-opsz-lg`, `icon-opsz-xl`                                                     | Optical size 20 / 24 / 40 / 48 without changing the font size, for example with `icon-[4em]`.                  |
| `icon-thin`, `icon-extralight`, `icon-light`, `icon-normal` (default), `icon-medium`, `icon-semibold`, `icon-bold` | Weight 100–700.                                                                                                |
| `icon-no-fill` (default), `icon-fill`                                                                              | Fill 0 / 1.                                                                                                    |
| `icon-on-light` (default), `icon-on-dark`, `icon-high`                                                             | Grade 0 / -25 / 200. Use `icon-on-dark` for light icons on dark backgrounds.                                   |

## Customization

All values are theme variables, defined in [`src/index.css`](https://github.com/janispritzkau/tailwindcss-material-symbols/blob/main/packages/tailwindcss-material-symbols/src/index.css). Override or add them in your own `@theme` block:

```css
@theme {
  --default-icon-font: var(--icon-font-rounded); /* the style `icon` uses */
  --default-icon-wght: var(--icon-wght-light);

  --icon-size-2xl: --spacing(16); /* adds `icon-2xl` and `icon-opsz-2xl` */
  --icon-opsz-2xl: 48;
}
```

## CLI

Without Vite, subset the fonts from your compiled CSS, whichever tool built it:

```bash
npx @tailwindcss/cli -i src/style.css -o dist/style.css
npx tailwindcss-material-symbols subset dist/style.css --outDir dist/fonts
```

It writes `material-symbols-<style>.woff2` for each used style and a `material-symbols.css` with the `@font-face` rules. Load that stylesheet next to your CSS. Without file arguments it reads the CSS from stdin; `--outDir` defaults to `dist`.

The subsetter is also exported as `@janispritzkau/tailwindcss-material-symbols/subset`. `subsetMaterialSymbols(css)` returns `[{ fontFamily, fileName, source }]`.

## Tailwind CSS v3 (deprecated)

> [!WARNING]
> Tailwind CSS v3 support is deprecated and will be removed in a future minor version. New features target Tailwind CSS v4 only.

```js
// tailwind.config.js
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  plugins: [materialSymbols],
};
```

Your CSS needs `@tailwind base`, and the Vite plugin works the same, without `@tailwindcss/vite`. The utilities are the same as above.

## License

MIT. The Material Symbols fonts are by Google and licensed under the [Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE). They come from the [`material-symbols`](https://www.npmjs.com/package/material-symbols) package.
