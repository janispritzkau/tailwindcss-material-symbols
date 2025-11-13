import type { Config } from "tailwindcss";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols";

export default {
  content: ["./src/**/*.{ts,vue}", "./index.html"],
  plugins: [materialSymbols],
  theme: {
    extend: {
      icon: {
        font: {
          DEFAULT: "'Material Symbols Sharp'",
        },
      },
    },
  },
} satisfies Config;
