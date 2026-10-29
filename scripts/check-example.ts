// Checks that the example build emitted a small subset font for each style it uses.
// Run after `pnpm --filter ./examples/vite build`.
import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const ASSETS_DIR = resolve(import.meta.dirname, "../examples/vite/dist/assets");
const STYLES = ["outlined", "rounded", "sharp"];
const MAX_SIZE = 20 * 1024;

const files = await readdir(ASSETS_DIR);
let failed = false;

for (const style of STYLES) {
  const name = files.find(
    (file) => file.startsWith(`material-symbols-${style}-`) && file.endsWith(".woff2"),
  );
  if (!name) {
    console.error(`Missing subset font for ${style} in ${ASSETS_DIR}`);
    failed = true;
    continue;
  }
  const { size } = await stat(resolve(ASSETS_DIR, name));
  if (size > MAX_SIZE) {
    console.error(`${name} is ${size} bytes, expected at most ${MAX_SIZE}. Is the font subsetted?`);
    failed = true;
  } else {
    console.log(`${name}: ${size} bytes`);
  }
}

if (failed) process.exit(1);
