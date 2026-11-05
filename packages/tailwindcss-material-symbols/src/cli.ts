import cac from "cac";
import { fontFace } from "./font-face";
import { detectWithChars, subsetDetected } from "./subset";
import { version } from "../package.json" with { type: "json" };
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
      try {
        inputCss += readFileSync(file, "utf-8") + "\n";
      } catch (error) {
        console.error(`Could not read input file: ${(error as Error).message}`);
        process.exit(1);
      }
    }
    const detection = detectWithChars(inputCss);
    if (detection.symbols.size === 0) {
      console.error(
        "No Material Symbols found in the input. Pass the CSS that Tailwind compiled, not its source.",
      );
      process.exit(1);
    }
    const fonts = await subsetDetected(detection);
    const outDir = options.outDir ?? "dist";
    await mkdir(outDir, { recursive: true });
    let css = "";
    for (const font of fonts) {
      const path = `${outDir}/${font.fileName}`;
      await writeFile(path, font.source);
      console.log(`Wrote ${path}`);
      css += fontFace(font.fontFamily, font.fileName) + "\n";
    }
    const cssPath = `${outDir}/material-symbols.css`;
    await writeFile(cssPath, css.trimEnd() + "\n");
    console.log(`Wrote ${cssPath}`);
  });

cli.help();
cli.version(version);
cli.parse();

if (!cli.matchedCommand && !cli.options.help && !cli.options.version) {
  if (cli.args.length > 0) {
    console.error(`Unknown command: ${cli.args[0]}`);
    console.log();
    cli.outputHelp();
    process.exit(1);
  }
  cli.outputHelp();
}
