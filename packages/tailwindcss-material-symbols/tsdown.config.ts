import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: "./src/index.ts",
    format: "cjs",
  },
  {
    entry: ["./src/vite.ts", "./src/subset.ts"],
    format: "esm",
    async onSuccess() {
      const entry = await readFile(
        fileURLToPath(new URL("./src/index.css", import.meta.url)),
        "utf-8",
      );
      const codepoints = await readFile(
        fileURLToPath(new URL("./src/generated/codepoints.css", import.meta.url)),
        "utf-8",
      );
      await writeFile(
        fileURLToPath(new URL("./dist/index.css", import.meta.url)),
        `${entry}\n${codepoints.replace(/^\/\*.*\*\/\n/, "")}`,
      );
    },
  },
]);
