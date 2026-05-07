import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// When running locally (npm run dev), the backend Docker container is
// accessible at localhost:5001 — NOT via the "backend" Docker hostname.
// Inside Docker the VITE_API_TARGET env var is not set, so it falls back
// to the Docker-internal hostname automatically.
const API_TARGET = process.env.VITE_API_TARGET ?? "http://backend:5000";
const AI_TARGET  = process.env.VITE_AI_TARGET  ?? "http://ai-service:8000";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.svg", "robots.txt"],
      manifest: {
        name: "VyaparIQ — AI-Powered Smart Shopping",
        short_name: "VyaparIQ",
        description: "AI-powered smart shopping platform. Manage budgets, track spending, and shop smarter.",
        theme_color: "#F97316",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        categories: ["shopping", "finance", "productivity"],
        icons: [
          {
            src: "/logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // CRITICAL: Don't intercept backend / OAuth navigations with the SPA shell.
        // Without this, /api/auth/google (and other backend redirects) get served
        // index.html → the user lands on the landing page instead of Google OAuth.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/ai\//],
        // Take over all open tabs immediately when a new SW is deployed —
        // prevents users getting stuck on a stale SW after deploy.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":   ["react", "react-dom", "react-router-dom"],
          "vendor-motion":  ["framer-motion"],
          "vendor-charts":  ["recharts"],
          "vendor-pdf":     ["jspdf", "jspdf-autotable"],
          "vendor-scanner": ["html5-qrcode"],
          "vendor-zustand": ["zustand"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
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