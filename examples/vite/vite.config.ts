import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

export default defineConfig({
  plugins: [tailwindcss(), materialSymbols()],
});
