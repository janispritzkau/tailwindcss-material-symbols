import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/v3/index.ts", "./src/vite.ts", "./src/subset.ts", "./src/cli.ts"],
  format: "esm",
  // Explicit, so that declarations are still built when no `types` export points at `.`.
  dts: true,
  // `exports` and `bin` point at `.js` and `.d.ts`; newer tsdown versions default to `.mjs` and `.d.mts`.
  fixedExtension: false,
});
