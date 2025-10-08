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

export default async function subsetMaterialSymbols(
  css: string,
  options?: SubsetOptions,
): Promise<Partial<Record<"outlined" | "rounded" | "sharp", Buffer>>> {
  const fontFamily = { ...DEFAULT_OPTIONS.fontFamily, ...options?.fontFamily };
  const defaults = { ...DEFAULT_OPTIONS.defaults, ...options?.defaults };
  const fontNames = Object.fromEntries(
    Object.entries(fontFamily).map(([k, v]) => [v, k]),
  ) as Record<string, "outlined" | "rounded" | "sharp">;

  const usedFont = new Set(
    Array.from(
      css.matchAll(FONT_REGEX),
      (m) => fontNames[m.groups!.value4! ?? m.groups!.value3!],
    ).filter((x) => x != null),
  );
  const usedOpsz = new Set(
    Array.from(css.matchAll(OPSZ_REGEX), (m) => Number(m.groups!.value4! ?? m.groups!.value3!)),
  );
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

  const usedSymbols = new Map(
    Array.from(
      css.matchAll(SYMBOLS_REGEX),
      (m) => [m.groups!.key4! ?? m.groups!.key3!, m.groups!.value4! ?? m.groups!.value3!] as const,
    ).filter((v): v is [keyof typeof codepoints, string] => v[0] in codepoints),
  );

  const content = Array.from(usedSymbols.values()).join("");

  const output: Partial<Record<"outlined" | "rounded" | "sharp", Buffer>> = {};

  for (const font of usedFont) {
    if (!font) continue;

    const fontInput = await readFile(
      fileURLToPath(new URL(`../material-symbols-${font}.woff2`, import.meta.url)),
    );

    const fontOutput = await subsetFont(fontInput, content, {
      targetFormat: "woff2",
      variationAxes: {
        wght: { min: Math.min(...usedWght), max: Math.max(...usedWght) },
        opsz: { min: Math.min(...usedOpsz), max: Math.max(...usedOpsz) },
        FILL: usedFill.size > 1 ? { min: Math.min(...usedFill), max: Math.max(...usedFill) } : 0,
        GRAD: usedGrad.size > 1 ? { min: Math.min(...usedGrad), max: Math.max(...usedGrad) } : 0,
      },
    });

    output[font] = fontOutput;
  }

  return output;
}

const FONT_VARIANTS = ["outlined", "rounded", "sharp"] as const;
const OPSZ_VARIANTS = ["sm", "md", "lg", "xl"] as const;
const WGHT_VARIANTS = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
] as const;
const GRAD_VARIANTS = ["on-dark", "on-light", "high"] as const;
const FILL_VARIANTS = ["no-fill", "fill"] as const;

const FONT_REGEX_V3 = `[\\.:]icon-(${FONT_VARIANTS.join("|")})[^{]*\\{(\\s*|[^}]+;\\s*)font-family:\\s*(?!var\\()['"]?(?<value3>[^'";}]+)`;
const OPSZ_REGEX_V3 = `(?<!\\w|-)--icon-opsz:\\s*(?<value3>-?\\d+)`;
const WGHT_REGEX_V3 = `(?<!\\w|-)--icon-wght:\\s*(?<value3>-?\\d+)`;
const GRAD_REGEX_V3 = `(?<!\\w|-)--icon-grad:\\s*(?<value3>-?\\d+)`;
const FILL_REGEX_V3 = `(?<!\\w|-)--icon-fill:\\s*(?<value3>-?\\d+)`;
const SYMBOLS_REGEX_V3 = `[\\.:]icon-symbol-(?<key3>\\w+)[^{]*\\{(\\s*|[^}]+;\\s*)--icon-symbol:\\s*(?!var\\()['"]?(?<value3>[^'";}]+)`;

const FONT_REGEX_V4 = `(?<!\\w|-)--icon-font-(${FONT_VARIANTS.join("|")}):\\s*['"]?(?<value4>[^'";}]+)`;
const OPSZ_REGEX_V4 = `(?<!\\w|-)--icon-opsz-(${OPSZ_VARIANTS.join("|")}):\\s*(?<value4>-?\\d+)`;
const WGHT_REGEX_V4 = `(?<!\\w|-)--icon-wght-(${WGHT_VARIANTS.join("|")}):\\s*(?<value4>-?\\d+)`;
const GRAD_REGEX_V4 = `(?<!\\w|-)--icon-grad-(${GRAD_VARIANTS.join("|")}):\\s*(?<value4>-?\\d+)`;
const FILL_REGEX_V4 = `(?<!\\w|-)--icon-fill-(${FILL_VARIANTS.join("|")}):\\s*(?<value4>-?\\d+)`;
const SYMBOLS_REGEX_V4 = `(?<!\\w|-)--icon-symbol-(?<key4>\\w+):\\s*['"]?(?<value4>[^'";}]+)`;

const FONT_REGEX = new RegExp(`${FONT_REGEX_V3}|${FONT_REGEX_V4}`, "g");
const OPSZ_REGEX = new RegExp(`${OPSZ_REGEX_V3}|${OPSZ_REGEX_V4}`, "g");
const WGHT_REGEX = new RegExp(`${WGHT_REGEX_V3}|${WGHT_REGEX_V4}`, "g");
const GRAD_REGEX = new RegExp(`${GRAD_REGEX_V3}|${GRAD_REGEX_V4}`, "g");
const FILL_REGEX = new RegExp(`${FILL_REGEX_V3}|${FILL_REGEX_V4}`, "g");
const SYMBOLS_REGEX = new RegExp(`${SYMBOLS_REGEX_V3}|${SYMBOLS_REGEX_V4}`, "g");

if (import.meta.main) {
  const css = await readFile(process.argv[2]!, "utf-8");
  const output = await subsetMaterialSymbols(css);
  console.log(output);
}
