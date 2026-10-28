# Material Symbols for Tailwind CSS

[Material Symbols](https://fonts.google.com/icons) as Tailwind CSS utilities, with font subsetting for production builds. Supports Tailwind CSS v4 and v3.

```html
<span class="icon icon-symbol-favorite icon-rounded icon-fill icon-lg"></span>
```

**The full documentation is in the [package README](packages/tailwindcss-material-symbols/README.md).** The same file is published on [npm](https://www.npmjs.com/package/@janispritzkau/tailwindcss-material-symbols).

## Quick start (Tailwind v4 + Vite)

```bash
npm install -D @janispritzkau/tailwindcss-material-symbols
```

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
  plugins: [tailwindcss(), materialSymbols({ include: ["./src/style.css"] })],
});
```

For Tailwind v3, the CLI, and all utilities and options, see the [package README](packages/tailwindcss-material-symbols/README.md).

## Repository layout

| Path                                                                             | Contents                                                                |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`packages/tailwindcss-material-symbols`](packages/tailwindcss-material-symbols) | The published package: Tailwind plugin/CSS, Vite plugin, CLI, subsetter |
| [`examples/tailwindcss-v4`](examples/tailwindcss-v4)                             | Vue + Vite example with Tailwind v4                                     |
| [`examples/tailwindcss-v3`](examples/tailwindcss-v3)                             | Vue + Vite example with Tailwind v3 (PostCSS)                           |
| [`scripts`](scripts)                                                             | Scripts that download and update the upstream fonts and codepoints      |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, scripts, and release process.

## License

MIT. The Material Symbols fonts are by Google and licensed under the [Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE).
