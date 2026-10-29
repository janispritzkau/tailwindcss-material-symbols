import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";
import codepoints from "./generated/codepoints";

export interface SubsetOptions {
  fontFamily?: Record<"outlined" | "rounded" | "sharp", string>;
  defaults?: {
    font?: "outlined" | "rounded" | "sharp";
    opsz?: number;
    wght?: number;
    grad?: number;
    fill?: number;
  };
}

const DEFAULT_OPTIONS = {
  fontFamily: {
    outlined: "Material Symbols Outlined",
    rounded: "Material Symbols Rounded",
    sharp: "Material Symbols Sharp",
  },
  defaults: {
    font: "outlined",
    opsz: 24,
    wght: 400,
    grad: 0,
    fill: 0,
  },
} satisfies SubsetOptions;

type Font = "outlined" | "rounded" | "sharp";

interface AxisRange {
  min: number;
  max: number;
}

/** @internal Result of {@link detect}. Exported for tests. */
export interface Detection {
  fonts: Font[];
  opsz: AxisRange;
  wght: AxisRange;
  grad: AxisRange;
  fill: AxisRange;
  /** Names of the used symbols that exist in the font. */
  symbols: string[];
}

/** @internal Detects the used font styles, axis ranges and symbols in Tailwind output. */
export function detect(css: string, options?: SubsetOptions): Detection {
  const fontFamily = { ...DEFAULT_OPTIONS.fontFamily, ...options?.fontFamily };
  const defaults = { ...DEFAULT_OPTIONS.defaults, ...options?.defaults };
  const fontNames = Object.fromEntries(
    Object.entries(fontFamily).map(([k, v]) => [v, k]),
  ) as Record<string, Font>;

  const usedFont = new Set(
    Array.from(
      css.matchAll(FONT_REGEX),
      (m) => fontNames[m.groups!.value4! ?? m.groups!.value3!],
    ).filter((x) => x != null),
  );
  const usedOpsz = new Set([
    ...Array.from(css.matchAll(OPSZ_REGEX), (m) => Number(m.groups!.value4! ?? m.groups!.value3!)),
    ...Array.from(css.matchAll(OPSZ_CALC_REGEX), (m) => Number(m.groups!.value!) * 4),
  ]);
  const usedWght = new Set(
    Array.from(css.matchAll(WGHT_REGEX), (m) => Number(m.groups!.value4! ?? m.groups!.value3!)),
  );
  const usedGrad = new Set(
    Array.from(css.matchAll(GRAD_REGEX), (m) => Number(m.groups!.value4! ?? m.groups!.value3!)),
  );
  const usedFill = new Set(
    Array.from(css.matchAll(FILL_REGEX), (m) => Number(m.groups!.value4! ?? m.groups!.value3!)),
  );

  usedFont.add(defaults.font);
  usedOpsz.add(defaults.opsz);
  usedWght.add(defaults.wght);
  usedGrad.add(defaults.grad);
  usedFill.add(defaults.fill);

  const usedSymbols = new Set(
    Array.from(css.matchAll(SYMBOLS_REGEX), (m) => m.groups!.key4! ?? m.groups!.key3!).filter(
      (k): k is keyof typeof codepoints => k in codepoints,
    ),
  );

  return {
    fonts: Array.from(usedFont).filter((font) => font),
    opsz: range(usedOpsz),
    wght: range(usedWght),
    grad: range(usedGrad),
    fill: range(usedFill),
    symbols: Array.from(usedSymbols),
  };
}

function range(values: Set<number>): AxisRange {
  return { min: Math.min(...values), max: Math.max(...values) };
}

export default async function subsetMaterialSymbols(
  css: string,
  options?: SubsetOptions,
): Promise<Partial<Record<Font, Buffer>>> {
  const { fonts, opsz, wght, grad, fill, symbols } = detect(css, options);

  const content = symbols.map((k) => codepoints[k as keyof typeof codepoints]).join("");

  const output: Partial<Record<Font, Buffer>> = {};

  for (const font of fonts) {
    const fontInput = await readFile(
      fileURLToPath(new URL(`../assets/material-symbols-${font}.woff2`, import.meta.url)),
    );

    const fontOutput = await subsetFont(fontInput, content, {
      targetFormat: "woff2",
      variationAxes: {
        wght,
        opsz,
        FILL: fill.min != fill.max ? fill : 0,
        GRAD: grad.min != grad.max ? grad : 0,
      },
    });

    output[font] = fontOutput;
  }

  return output;
}

// v3: utilities set literal values (`--icon-opsz: 40`), and `.icon` sets the defaults as
// `font-family` and as fallbacks (`var(--icon-opsz, 24)`).
const FONT_REGEX_V3 = `[\\.:]icon(?:-[\\w-]+)?(?![\\w-])[^{]*\\{(\\s*|[^}]+;\\s*)font-family:\\s*(?!var\\()['"]?(?<value3>[^'";}]+)`;
const OPSZ_REGEX_V3 = `(?<!\\w|-)--icon-opsz[:,]\\s*(?<value3>-?\\d+)`;
const WGHT_REGEX_V3 = `(?<!\\w|-)--icon-wght[:,]\\s*(?<value3>-?\\d+)`;
const GRAD_REGEX_V3 = `(?<!\\w|-)--icon-grad[:,]\\s*(?<value3>-?\\d+)`;
const FILL_REGEX_V3 = `(?<!\\w|-)--icon-fill[:,]\\s*(?<value3>-?\\d+)`;
const SYMBOLS_REGEX_V3 = `[\\.:]icon-symbol-(?<key3>\\w+)[^{]*\\{(\\s*|[^}]+;\\s*)--icon-symbol:\\s*(?!var\\()['"]?(?<value3>[^'";}]+)`;

// v4: theme variables are only emitted when used, including custom keys (`--icon-opsz-2xl`).
const FONT_REGEX_V4 = `(?<!\\w|-)--icon-font-[\\w-]+:\\s*['"]?(?<value4>[^'";}]+)`;
const OPSZ_REGEX_V4 = `(?<!\\w|-)--icon-opsz-[\\w-]+:\\s*(?<value4>-?\\d+)`;
const WGHT_REGEX_V4 = `(?<!\\w|-)--icon-wght-[\\w-]+:\\s*(?<value4>-?\\d+)`;
const GRAD_REGEX_V4 = `(?<!\\w|-)--icon-grad-[\\w-]+:\\s*(?<value4>-?\\d+)`;
const FILL_REGEX_V4 = `(?<!\\w|-)--icon-fill-[\\w-]+:\\s*(?<value4>-?\\d+)`;
// v4: numeric sizes (`icon-8`) set `--icon-opsz: calc(8 * 4)`, which isn't folded, not even when
// minified.
const OPSZ_CALC_REGEX_V4 = `(?<!\\w|-)--icon-opsz:\\s*calc\\(\\s*(?<value>\\d+)\\s*\\*\\s*4\\s*\\)`;
const SYMBOLS_REGEX_V4 = `(?<!\\w|-)--icon-symbol-(?<key4>\\w+):\\s*['"]?(?<value4>[^'";}]+)`;

const FONT_REGEX = new RegExp(`${FONT_REGEX_V3}|${FONT_REGEX_V4}`, "g");
const OPSZ_REGEX = new RegExp(`${OPSZ_REGEX_V3}|${OPSZ_REGEX_V4}`, "g");
const OPSZ_CALC_REGEX = new RegExp(OPSZ_CALC_REGEX_V4, "g");
const WGHT_REGEX = new RegExp(`${WGHT_REGEX_V3}|${WGHT_REGEX_V4}`, "g");
const GRAD_REGEX = new RegExp(`${GRAD_REGEX_V3}|${GRAD_REGEX_V4}`, "g");
const FILL_REGEX = new RegExp(`${FILL_REGEX_V3}|${FILL_REGEX_V4}`, "g");
const SYMBOLS_REGEX = new RegExp(`${SYMBOLS_REGEX_V3}|${SYMBOLS_REGEX_V4}`, "g");
