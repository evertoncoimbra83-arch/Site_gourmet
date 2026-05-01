// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const pwaConfig = {
  registerType: "autoUpdate" as const,
  includeAssets: [
    "favicon.ico",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
  ],
  manifest: false as const,
  workbox: {
    navigateFallback: null,
    runtimeCaching: [
      {
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|woff2?)$/,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "gourmet-assets",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /\/trpc\//,
        handler: "NetworkOnly" as const,
      },
    ],
  },
  devOptions: {
    enabled: false,
  },
};

export default defineConfig({
  root: path.resolve(process.cwd(), "client"),

  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    "process.env": "{}",
  },

  plugins: [
    tailwindcss(),
    react(),
    VitePWA(pwaConfig),
  ],

  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client/src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },

  envDir: path.resolve(process.cwd()),

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
});