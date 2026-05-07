// ============================================================
// src/router.tsx — Setup TanStack Router (client-side)
//
// Untuk tambah route baru: buat file baru di src/routes/
// TanStack Router akan auto-generate routeTree.gen.ts
// ============================================================

import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
