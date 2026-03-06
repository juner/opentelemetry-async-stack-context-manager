import { resolve } from "path";
import { defineConfig } from "vite";
export default defineConfig({
  build: {
    lib: {
      entry: {
        "index": resolve(__dirname, "src/index.ts"),
        "tool/index": resolve(__dirname, "src/tool/index.ts"),
      },
      fileName: (format, name) => `${name}.${(format === "cjs" ? "cjs" : format === "es" ? "mjs" : "js")}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "@opentelemetry/api",
      ],
    }
  }
});