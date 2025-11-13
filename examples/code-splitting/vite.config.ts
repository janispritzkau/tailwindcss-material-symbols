import { defineConfig } from "vite";

import tailwindcss from "@tailwindcss/vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), materialSymbols()],
});
