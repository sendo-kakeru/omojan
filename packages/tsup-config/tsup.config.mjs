import { defineConfig } from "tsup";

export const config = defineConfig({
  format: ["esm", "cjs"],
  legacyOutput: true,
  entry: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.{spec,test}.{ts,tsx}",
    "src/**/*.{jpg,png,svg}",
  ],
  outDir: "dist",
  target: "esnext",
  bundle: false,
  sourcemap: true,
  dts: false,
  loader: {
    ".jpg": "copy",
    ".png": "copy",
    ".svg": "copy",
  },
});
