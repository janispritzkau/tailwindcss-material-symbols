import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import subsetFont from "subset-font";
import type { Matches } from "./detect";
import { detectV3 } from "./detect-v3";
import { detectV4 } from "./detect-v4";

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

/** @internal Detects the used font styles, axis ranges and symbols in Tailwind output. */
export function detect(css: string, options?: SubsetOptions): Detection {
  const { symbols, ...detection } = detectWithChars(css, options);
  return { ...detection, symbols: Array.from(symbols.keys()) };
}

/** Like {@link detect}, but with a map from each symbol name to its character. */
function detectWithChars(
  css: string,
  options?: SubsetOptions,
): Omit<Detection, "symbols"> & { symbols: Map<string, string> } {
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

  usedFont.add(defaults.font);
  usedOpsz.add(defaults.opsz);
  usedWght.add(defaults.wght);
  usedGrad.add(defaults.grad);
  usedFill.add(defaults.fill);

  return {
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

export default async function subsetMaterialSymbols(
  css: string,
  options?: SubsetOptions,
): Promise<Partial<Record<Font, Buffer>>> {
  const { fonts, opsz, wght, grad, fill, symbols } = detectWithChars(css, options);

  const content = Array.from(symbols.values()).join("");

  const output: Partial<Record<Font, Buffer>> = {};

  for (const font of fonts) {
    const fontInput = await readFile(
      require.resolve(`material-symbols/material-symbols-${font}.woff2`),
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
