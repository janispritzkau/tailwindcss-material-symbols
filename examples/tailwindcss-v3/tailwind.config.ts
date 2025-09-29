import type { Config } from "tailwindcss";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols";

export default {
  content: ["./src/**/*.{ts,vue}", "./index.html"],
  plugins: [materialSymbols],
} satisfies Config;
