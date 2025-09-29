import { copyFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsdown";
import { bundle } from "lightningcss";

export default defineConfig([
  {
    entry: "./src/index.ts",
    format: ["cjs"],
  },
  {
    entry: ["./src/index.ts", "./src/index.css", "./src/vite.ts"],
    async onSuccess(config) {
      const { code } = bundle({
        filename: fileURLToPath(new URL("./src/index.css", import.meta.url)),
        minify: true,
      });
      await writeFile(fileURLToPath(new URL("./dist/index.css", import.meta.url)), code);
      for (const file of ["outlined.css", "rounded.css", "sharp.css"]) {
        await copyFile(
          fileURLToPath(new URL(`./src/${file}`, import.meta.url)),
          fileURLToPath(new URL(`./dist/${file}`, import.meta.url)),
        );
      }
    },
  },
]);
