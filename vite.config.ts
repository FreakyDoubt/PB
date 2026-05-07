// ============================================================
// vite.config.ts — Konfigurasi build untuk Vercel (SPA mode)
//
// Output: folder dist/ yang bisa di-deploy langsung ke Vercel.
// Tidak ada SSR — murni client-side rendering.
//
// Untuk ubah port dev: ubah server.port di bawah
// Untuk ubah base URL (kalau deploy ke subfolder): ubah base
// ============================================================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    // Auto-generate routeTree.gen.ts dari file di src/routes/
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // Alias @ → src/ supaya import @/components/... bisa dipakai
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // Output ke dist/ — ini yang di-deploy ke Vercel
    outDir: "dist",
  },
});
