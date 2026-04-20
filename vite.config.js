import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { getValidatedFirebaseConfig } from "./src/services/firebaseConfig.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  getValidatedFirebaseConfig(loadEnv(mode, rootDir, ""), {
    context: "build",
  });

  return {
    plugins: [react()],
  };
});
