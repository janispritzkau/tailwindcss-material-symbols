import cac from "cac";
import subsetMaterialSymbols from "./subset";
import { version } from "../package.json" assert { type: "json" };
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";

const cli = cac("tailwindcss-material-symbols");

cli
  .command("subset [...input]", "Subset material symbols from Tailwind-processed input CSS")
  .option("--outDir <dir>", "[string] Output directory (default: dist)")
  .action(async (input, options) => {
    let inputCss = "";
    if (input.length === 0) {
      if (process.stdin.isTTY) {
        console.error("No input files specified.");
        console.log();
        cli.outputHelp();
        process.exit(1);
      }
      inputCss = readFileSync(0, "utf-8");
    }
    for (const file of input) {
      inputCss += readFileSync(file, "utf-8") + "\n";
    }
    const output = await subsetMaterialSymbols(inputCss);
    const outDir = options.outDir ?? "dist";
    await mkdir(outDir, { recursive: true });
    let css = "";
    for (const [variant, data] of Object.entries(output)) {
      const path = `${outDir}/material-symbols-${variant}.woff2`;
      await writeFile(path, data!);
      console.log(`Wrote ${path}`);
      css += `@font-face {
  font-family: "Material Symbols ${variant.replace(/^./, (c) => c.toUpperCase())}";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url("material-symbols-${variant}.woff2") format("woff2");
}\n\n`;
    }
    const cssPath = `${outDir}/material-symbols.css`;
    await writeFile(cssPath, css.trimEnd() + "\n");
    console.log(`Wrote ${cssPath}`);
  });

cli.help();
cli.version(version);
cli.parse();

if (!cli.matchedCommand) {
  cli.outputHelp();
}
