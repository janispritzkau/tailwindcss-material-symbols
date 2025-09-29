import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import subsetMaterialSymbols from "@janispritzkau/tailwindcss-material-symbols/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), subsetMaterialSymbols({ include: ["./src/style.css"] })],
  build: {
    cssCodeSplit: false,
  },
});
