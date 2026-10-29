import { matchNumbers, matchSymbols, type Matches } from "./detect";

// Theme variables are only emitted when used, including custom keys (`--icon-opsz-2xl`).
const FONT_REGEX = /(?<!\w|-)--icon-font-[\w-]+:\s*['"]?(?<value>[^'";}]+)/g;
const OPSZ_REGEX = /(?<!\w|-)--icon-opsz-[\w-]+:\s*(?<value>-?\d+)/g;
const WGHT_REGEX = /(?<!\w|-)--icon-wght-[\w-]+:\s*(?<value>-?\d+)/g;
const GRAD_REGEX = /(?<!\w|-)--icon-grad-[\w-]+:\s*(?<value>-?\d+)/g;
const FILL_REGEX = /(?<!\w|-)--icon-fill-[\w-]+:\s*(?<value>-?\d+)/g;
// Numeric sizes (`icon-8`) set `--icon-opsz: calc(8 * 4)`, which isn't folded, not even when
// minified.
const OPSZ_CALC_REGEX = /(?<!\w|-)--icon-opsz:\s*calc\(\s*(?<value>\d+)\s*\*\s*4\s*\)/g;
const SYMBOLS_REGEX = /(?<!\w|-)--icon-symbol-(?<key>\w+):\s*['"]?(?<value>[^'";}]+)/g;

/** Detects the values in Tailwind v4 output of `src/index.css`. */
export function detectV4(css: string): Matches {
  return {
    fonts: Array.from(css.matchAll(FONT_REGEX), (m) => m.groups!.value!),
    opsz: [
      ...matchNumbers(css, OPSZ_REGEX),
      ...matchNumbers(css, OPSZ_CALC_REGEX).map((n) => n * 4),
    ],
    wght: matchNumbers(css, WGHT_REGEX),
    grad: matchNumbers(css, GRAD_REGEX),
    fill: matchNumbers(css, FILL_REGEX),
    symbols: matchSymbols(css, SYMBOLS_REGEX),
  };
}
