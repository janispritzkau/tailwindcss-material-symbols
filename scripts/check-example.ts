// Checks the fonts of the example build. Run after `pnpm --filter ./examples/vite build`.
// - The document stylesheet has a small subset font for each style, emitted or inlined.
// - Its Sharp font contains the shadow root's symbol (`widgets`, U+E1BD), as browsers only use the
//   document's fonts inside a shadow root.
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

// fontkit is a dev dependency of the package.
const fontkit: { create(font: Buffer): { characterSet: number[] } } = createRequire(
  resolve(import.meta.dirname, "../packages/tailwindcss-material-symbols/package.json"),
)("fontkit");

const DIST_DIR = resolve(import.meta.dirname, "../examples/vite/dist");
const STYLES = ["Outlined", "Rounded", "Sharp"];
const MAX_SIZE = 20 * 1024;
const SHADOW_SYMBOL = 0xe1bd;

const assets = await readdir(resolve(DIST_DIR, "assets"));
let css = "";
for (const file of assets.filter((file) => file.endsWith(".css"))) {
  css += await readFile(resolve(DIST_DIR, "assets", file), "utf-8");
}
const fontFaces = Array.from(css.matchAll(/@font-face\s*\{[^}]*\}/g), (m) => m[0]);
let failed = false;

function fail(message: string) {
  console.error(message);
  failed = true;
}

async function readFont(url: string): Promise<Buffer> {
  const data = /^data:font\/woff2;base64,(.*)$/.exec(url);
  if (data) return Buffer.from(data[1]!, "base64");
  return readFile(resolve(DIST_DIR, url.replace(/^\//, "")));
}

for (const style of STYLES) {
  const face = fontFaces.find((face) => face.includes(`Material Symbols ${style}`));
  const url = face && /url\(["']?([^"')]+)["']?\)/.exec(face)?.[1];
  if (!face || !url) {
    fail(`Missing @font-face for Material Symbols ${style} in the document stylesheet`);
    continue;
  }
  const font = await readFont(url);
  const name = url.startsWith("data:") ? `${style} (inlined)` : url;
  if (font.length > MAX_SIZE) {
    fail(`${name} is ${font.length} bytes, expected at most ${MAX_SIZE}. Is the font subsetted?`);
  } else {
    console.log(`${name}: ${font.length} bytes`);
  }
  const { characterSet } = fontkit.create(font);
  if (style == "Sharp" && !characterSet.includes(SHADOW_SYMBOL)) {
    fail(`The Sharp font doesn't contain the shadow root's symbol (U+E1BD)`);
  }
}

if (failed) process.exit(1);
