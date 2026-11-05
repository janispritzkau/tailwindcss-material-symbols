import { matchNumbers, matchSymbols, NUMBER, type Matches } from "./detect";

// Theme variables are only emitted when used, including custom keys (`--icon-opsz-2xl`). The
// `--default-icon-*` variables also match, for literal values (`--default-icon-wght: 300`).
const FONT_REGEX = /(?<!\w|-)--(?:icon-font-[\w-]+|default-icon-font):\s*['"]?(?<value>[^'";}]+)/g;
const OPSZ_REGEX = new RegExp(
  String.raw`(?<!\w|-)--(?:icon-opsz-[\w-]+|default-icon-opsz):\s*(?<value>${NUMBER})`,
  "g",
);
const WGHT_REGEX = new RegExp(
  String.raw`(?<!\w|-)--(?:icon-wght-[\w-]+|default-icon-wght):\s*(?<value>${NUMBER})`,
  "g",
);
const GRAD_REGEX = new RegExp(
  String.raw`(?<!\w|-)--(?:icon-grad-[\w-]+|default-icon-grad):\s*(?<value>${NUMBER})`,
  "g",
);
const FILL_REGEX = new RegExp(
  String.raw`(?<!\w|-)--(?:icon-fill-[\w-]+|default-icon-fill):\s*(?<value>${NUMBER})`,
  "g",
);
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
