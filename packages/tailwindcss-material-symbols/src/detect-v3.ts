// Detection for the deprecated Tailwind v3 plugin (`src/v3/`). Delete this file together with it.

import { matchNumbers, matchSymbols, type Matches } from "./detect";

// Utilities set literal values (`--icon-opsz: 40`), and `.icon` sets the defaults as
// `font-family` and as fallbacks (`var(--icon-opsz, 24)`).
const FONT_REGEX =
  /[.:]icon(?:-[\w-]+)?(?![\w-])[^{]*\{(\s*|[^}]+;\s*)font-family:\s*(?!\s|var\()['"]?(?<value>[^'";}]+)/g;
const OPSZ_REGEX = /(?<!\w|-)--icon-opsz[:,]\s*(?<value>-?\d+)/g;
const WGHT_REGEX = /(?<!\w|-)--icon-wght[:,]\s*(?<value>-?\d+)/g;
const GRAD_REGEX = /(?<!\w|-)--icon-grad[:,]\s*(?<value>-?\d+)/g;
const FILL_REGEX = /(?<!\w|-)--icon-fill[:,]\s*(?<value>-?\d+)/g;
// The plugin writes the raw character after a backslash (`"\<char>"`). `(?!\s|var\()` skips
// the `var()` references of Tailwind v4 output, also after whitespace.
const SYMBOLS_REGEX =
  /[.:]icon-symbol-(?<key>\w+)[^{]*\{(\s*|[^}]+;\s*)--icon-symbol:\s*(?!\s|var\()['"]?(?<value>[^'";}]+)/g;

/** Detects the values in Tailwind v3 output of the plugin in `src/v3/`. */
export function detectV3(css: string): Matches {
  return {
    fonts: Array.from(css.matchAll(FONT_REGEX), (m) => m.groups!.value!),
    opsz: matchNumbers(css, OPSZ_REGEX),
    wght: matchNumbers(css, WGHT_REGEX),
    grad: matchNumbers(css, GRAD_REGEX),
    fill: matchNumbers(css, FILL_REGEX),
    symbols: matchSymbols(css, SYMBOLS_REGEX),
  };
}
