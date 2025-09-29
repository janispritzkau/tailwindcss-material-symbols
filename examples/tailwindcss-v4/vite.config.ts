import { defineConfig } from "vite";

import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import materialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), materialSymbols({ include: ["./src/style.css"] })],
});
