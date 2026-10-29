/** Raw values found in Tailwind output by one of the `detect-*` modules. */
export interface Matches {
  /** Font family names, for example `Material Symbols Rounded`. */
  fonts: string[];
  opsz: number[];
  wght: number[];
  grad: number[];
  fill: number[];
  /** Symbol names and their characters. */
  symbols: [name: string, char: string][];
}

/**
 * Parses the character of an `--icon-symbol` value without its quotes. Unminified CSS has an escape
 * (`\e9b2`). Minifiers like lightningcss replace it with the raw character.
 */
function parseSymbolValue(value: string): string | undefined {
  const escape = /^\\([0-9a-fA-F]{1,6})\s?$/.exec(value);
  const codepoint = escape ? parseInt(escape[1]!, 16) : value.replace(/^\\/, "").codePointAt(0);
  if (codepoint == null || codepoint == 0 || codepoint > 0x10ffff) return undefined;
  return String.fromCodePoint(codepoint);
}

/** Returns the numeric `value` group of every match. */
export function matchNumbers(css: string, regex: RegExp): number[] {
  return Array.from(css.matchAll(regex), (m) => Number(m.groups!.value!));
}

/** Returns the `key` group and the character of the `value` group of every match. */
export function matchSymbols(css: string, regex: RegExp): [name: string, char: string][] {
  return Array.from(
    css.matchAll(regex),
    (m) => [m.groups!.key!, parseSymbolValue(m.groups!.value!)] as const,
  ).filter((s): s is [string, string] => s[1] != null);
}
