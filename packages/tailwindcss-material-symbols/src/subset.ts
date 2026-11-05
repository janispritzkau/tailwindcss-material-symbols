import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import subsetFont from "subset-font";
import type { Matches } from "./detect";
import { detectV3 } from "./detect-v3";
import { detectV4 } from "./detect-v4";

export interface SubsetOptions {
  fontFamily?: Record<"outlined" | "rounded" | "sharp", string>;
  /**
   * The font style and axis values for CSS that doesn't show them. Tailwind output has the
   * defaults of the `icon` utility, so these are only used for a style or axis that the CSS has
   * no value for, for example in CSS without the `icon` utility.
   */
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

const require = createRequire(import.meta.url);

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
  /** Names of the used symbols. */
  symbols: string[];
}

/** @internal Like {@link Detection}, with the font family names and the symbols' characters. */
export interface DetectionWithChars extends Omit<Detection, "symbols"> {
  fontFamily: Record<Font, string>;
  /** Symbol names and their characters. */
  symbols: Map<string, string>;
}

/** A subsetted font. */
export interface SubsetFont {
  /** For example `Material Symbols Outlined`, or the name from the `fontFamily` option. */
  fontFamily: string;
  /** For example `material-symbols-outlined.woff2`. */
  fileName: string;
  /** The woff2 font. */
  source: Buffer;
}

/** @internal Detects the used font styles, axis ranges and symbols in Tailwind output. */
export function detect(css: string, options?: SubsetOptions): Detection {
  const { symbols, fontFamily: _, ...detection } = detectWithChars(css, options);
  return { ...detection, symbols: Array.from(symbols.keys()) };
}

/** @internal Like {@link detect}, but with the font family names and the symbols' characters. */
export function detectWithChars(css: string, options?: SubsetOptions): DetectionWithChars {
  const fontFamily = { ...DEFAULT_OPTIONS.fontFamily, ...options?.fontFamily };
  const defaults = { ...DEFAULT_OPTIONS.defaults, ...options?.defaults };
  const fontNames = Object.fromEntries(
    Object.entries(fontFamily).map(([k, v]) => [v, k]),
  ) as Record<string, Font>;

  // `detectV3` is for the deprecated Tailwind v3 plugin (`src/v3/`).
  const matches: Matches[] = [detectV4(css), detectV3(css)];
  const usedFont = new Set(
    matches.flatMap((m) => m.fonts.map((name) => fontNames[name]).filter((x) => x != null)),
  );
  const usedOpsz = new Set(matches.flatMap((m) => m.opsz));
  const usedWght = new Set(matches.flatMap((m) => m.wght));
  const usedGrad = new Set(matches.flatMap((m) => m.grad));
  const usedFill = new Set(matches.flatMap((m) => m.fill));

  // The CSS has the defaults of the `icon` utility: v4 output through the `--default-icon-*`
  // variables and the theme variables they refer to, v3 output through the `font-family` and the
  // `var()` fallbacks of `.icon`. So the defaults are only added if a value is missing, and not
  // always, which would ship a style or axis range that nothing uses.
  if (usedFont.size == 0) usedFont.add(defaults.font);
  if (usedOpsz.size == 0) usedOpsz.add(defaults.opsz);
  if (usedWght.size == 0) usedWght.add(defaults.wght);
  if (usedGrad.size == 0) usedGrad.add(defaults.grad);
  if (usedFill.size == 0) usedFill.add(defaults.fill);

  return {
    fontFamily,
    fonts: Array.from(usedFont),
    opsz: range(usedOpsz),
    wght: range(usedWght),
    grad: range(usedGrad),
    fill: range(usedFill),
    symbols: new Map(matches.flatMap((m) => m.symbols)),
  };
}

function range(values: Set<number>): AxisRange {
  return { min: Math.min(...values), max: Math.max(...values) };
}

const fontInputs = new Map<Font, Promise<Buffer>>();

/** Reads a full font from `material-symbols`, once per process. */
function readFontInput(font: Font): Promise<Buffer> {
  let input = fontInputs.get(font);
  if (!input) {
    input = readFile(require.resolve(`material-symbols/material-symbols-${font}.woff2`));
    input.catch(() => fontInputs.delete(font));
    fontInputs.set(font, input);
  }
  return input;
}

/** @internal Subsets the fonts to the result of {@link detectWithChars}. */
export async function subsetDetected(detection: DetectionWithChars): Promise<SubsetFont[]> {
  const { fontFamily, fonts, opsz, wght, grad, fill, symbols } = detection;
  const content = Array.from(symbols.values()).join("");

  return Promise.all(
    fonts.map(async (font) => ({
      fontFamily: fontFamily[font],
      fileName: `material-symbols-${font}.woff2`,
      source: await subsetFont(await readFontInput(font), content, {
        targetFormat: "woff2",
        variationAxes: {
          wght,
          opsz,
          FILL: fill.min != fill.max ? fill : fill.min,
          GRAD: grad.min != grad.max ? grad : grad.min,
        },
      }),
    })),
  );
}

/**
 * Subsets the fonts to the symbols, font styles and axis ranges used in compiled Tailwind CSS.
 * Returns one woff2 font for each used font style.
 */
export default async function subsetMaterialSymbols(
  css: string,
  options?: SubsetOptions,
): Promise<SubsetFont[]> {
  return subsetDetected(detectWithChars(css, options));
}
