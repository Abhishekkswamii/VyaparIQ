import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// When running locally (npm run dev), the backend Docker container is
// accessible at localhost:5001 — NOT via the "backend" Docker hostname.
// Inside Docker the VITE_API_TARGET env var is not set, so it falls back
// to the Docker-internal hostname automatically.
const API_TARGET = process.env.VITE_API_TARGET ?? "http://backend:5000";
const AI_TARGET  = process.env.VITE_AI_TARGET  ?? "http://ai-service:8000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
    },

    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
      "/ai": {
        target: AI_TARGET,
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});