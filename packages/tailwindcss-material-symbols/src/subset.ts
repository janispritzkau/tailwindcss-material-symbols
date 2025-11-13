import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import subsetFont from "subset-font";
import codepoints from "./generated/codepoints";

export interface SubsetFont {
  fontFamily: string;
  fileName: string;
  source: Buffer;
}

export default async function subsetMaterialSymbols(css: string): Promise<SubsetFont[]> {
  const root = postcss.parse(css);

  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--icon-") || decl.prop.startsWith("--default-icon-")) {
      console.log("DECL:", decl.prop, decl.value);
    }
  });

  root.walkRules((rule) => {
    if (rule.selector.includes("icon")) {
      console.log("RULE:", rule.selector);
      rule.walkDecls((decl) => {
        if (decl.prop === "font-family") {
          console.log(decl.value);
        }
        if (decl.prop === "font-variation-settings") {
          // console.log(decl.value.match(/var\(--icon\)));
          for (const match of decl.value.matchAll(
            /var\(--icon-(fill|wght|grad|opsz),\s*(\d+)\)/g,
          )) {
            const axis = match[1];
            const value = match[2];
            console.log(axis, value);
          }
        }
      });
    }
  });

  // const usedSymbols = new Map(
  //   Array.from(css.matchAll(SYMBOLS_REGEX), (m) => m.groups!.key4! ?? m.groups!.key3!)
  //     .filter((k): k is keyof typeof codepoints => k in codepoints)
  //     .map((k) => [k, codepoints[k]]),
  // );

  // const content = Array.from(usedSymbols.values()).join("");

  // const output: Partial<Record<"outlined" | "rounded" | "sharp", Buffer>> = {};

  // for (const font of usedFont) {
  //   if (!font) continue;

  //   const fontInput = await readFile(
  //     fileURLToPath(new URL(`../assets/material-symbols-${font}.woff2`, import.meta.url)),
  //   );

  //   const fontOutput = await subsetFont(fontInput, content, {
  //     targetFormat: "woff2",
  //     variationAxes: {
  //       wght: { min: Math.min(...usedWght), max: Math.max(...usedWght) },
  //       opsz: { min: Math.min(...usedOpsz), max: Math.max(...usedOpsz) },
  //       FILL: usedFill.size > 1 ? { min: Math.min(...usedFill), max: Math.max(...usedFill) } : 0,
  //       GRAD: usedGrad.size > 1 ? { min: Math.min(...usedGrad), max: Math.max(...usedGrad) } : 0,
  //     },
  //   });

  //   output[font] = fontOutput;
  // }
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
