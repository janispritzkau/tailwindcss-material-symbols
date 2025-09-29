import subsetFont from "subset-font";
import type { Plugin } from "vite";

export default function subsetMaterialSymbols(): Plugin {
  return {
    name: "subset-material-symbols",
    enforce: "post",
    async generateBundle(options, bundle) {
      const assets = Object.values(bundle).filter((item) => item.type == "asset");
      const style = assets.find((asset) => asset.names.some((name) => name.endsWith(".css")));
      const font = assets.find((asset) =>
        asset.names.some((name) => /material-symbols-\w+\.woff2/.test(name)),
      );

      const source = style?.source;
      if (typeof source != "string" || !font) return;

      const strings =
        source.match(
          /(?<=\.icon-symbol(?:-\w+)+::?before\s*{\s*content:\s*\")[^"]+(?=\")|(?<=--icon-symbol(?:-\w+)+:\s*\")[^"]+(?=\")/g,
        ) ?? [];
      const opsz = OPSZ_CLASSES.filter(([cls, opsz]) => source.includes(cls) || opsz == 24).map(
        ([, opsz]) => opsz,
      );
      const wght = WGHT_CLASSES.filter(([cls, wght]) => source.includes(cls) || wght == 400).map(
        ([, wght]) => wght,
      );

      console.log({ strings, opsz, wght });

      const output: Buffer = await subsetFont(Buffer.from(font.source), strings.join(""), {
        targetFormat: "woff2",
        variationAxes: {
          wght: { min: Math.min(...wght), max: Math.max(...wght) },
          opsz: { min: Math.min(...opsz), max: Math.max(...opsz) },
          FILL: source.includes(".icon-fill") ? { min: 0, max: 1 } : 0,
          GRAD: source.includes(".icon-on-dark") ? { min: -25, max: 0 } : 0,
        },
      });
      font.source = output;
    },
  };
}
const OPSZ_CLASSES = [
  [".icon-sm", 20],
  [".icon-md", 24],
  [".icon-lg", 40],
  [".icon-xl", 48],
] as const;

const WGHT_CLASSES = [
  [".icon-thin", 100],
  [".icon-extralight", 200],
  [".icon-light", 300],
  [".icon-normal", 400],
  [".icon-medium", 500],
  [".icon-semibold", 600],
  [".icon-bold", 700],
] as const;
