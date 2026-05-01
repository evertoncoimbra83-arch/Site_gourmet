/* eslint-disable @typescript-eslint/ban-ts-comment */
// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import { configDefaults } from 'vitest/config';

// Define a raiz do projeto de forma segura
const projectRoot = process.cwd();

export default defineConfig({
  // Mantemos o root na raiz para o Vite encontrar o index.html e as pastas client/server
  root: projectRoot,

  server: {
    // ✅ ADICIONADO: Configuração de Proxy para o Backend
    // Isso evita a "página branca" redirecionando chamadas de API para o servidor Node
    proxy: {
      "/api": {
        target: "http://localhost:3001", // 👈 Certifique-se que seu servidor Node roda nesta porta
        changeOrigin: true,
        secure: false,
      },
    },
  },

  plugins: [
    react(), 
    
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', 
      
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, 
      },

      manifest: {
        name: 'Gourmet Saudável',
        short_name: 'Gourmet',
        description: 'Refeições artesanais, saudáveis e práticas.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/uploads/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/uploads/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/uploads/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client/src"),
      "@shared": path.resolve(projectRoot, "shared"),
      "@assets": path.resolve(projectRoot, "attached_assets"),
      "@server": path.resolve(projectRoot, "server"),
    },
  },

  // ✅ CONFIGURAÇÃO DE TESTE REVISADA PARA WINDOWS
  // @ts-ignore
  test: {
    globals: true,
    environment: "node",
    pool: 'threads',
    
    // ✅ Removido o "./" inicial que impede o reconhecimento no Windows PowerShell
    include: ["server/**/*.{test,spec}.ts"], 
    
    exclude: [...configDefaults.exclude, "**/node_modules/**", "**/dist/**"],
    
    // ✅ Setup para carregar variáveis de ambiente
    setupFiles: [path.resolve(projectRoot, "server/vitest.setup.ts")],
    
    // ✅ Sintaxe compatível com Vitest 2.x/3.x
    server: {
      deps: {
        inline: [/drizzle-orm/],
      }
    }
  },
});