# Material Symbols for Tailwind CSS

Monorepo for `@janispritzkau/tailwindcss-material-symbols` – Material Symbols as Tailwind utilities with smart font subsetting.

## Package

Full documentation: `packages/tailwindcss-material-symbols/README.md` (same as on npm).

Highlights:

- Tailwind v3 plugin & v4 utility import
- Variation utilities for weight, size, fill, grade, family, symbol
- Vite plugin that subsets fonts automatically
- Planned standalone CLI

## Quick Start

```bash
pnpm add @janispritzkau/tailwindcss-material-symbols
```

### TailwindCSS v4

```css
@import "@janispritzkau/tailwindcss-material-symbols";
```

### TailwindCSS v3

```ts
// tailwind.config.ts
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols";
export default { content: ["./src/**/*.{ts,vue}", "./index.html"], plugins: [materialSymbols] };
```

```html
<span class="icon icon-symbol-home"></span>
<span class="icon icon-symbol-home icon-rounded icon-bold"></span>
```

Then use the same classes as v3.

## Examples

```bash
pnpm install
pnpm --filter ./examples/tailwindcss-v3 build
pnpm --filter ./examples/tailwindcss-v4 build
```

## Contributing

See `CONTRIBUTING.md` for update scripts, release workflow and roadmap.

## License

MIT (code). Material Symbols copyright Google.
