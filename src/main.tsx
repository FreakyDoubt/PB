// ============================================================
// src/main.tsx — Entry point aplikasi (SPA mode)
//
// Render React ke DOM, setup TanStack Router.
// Tidak perlu diubah kecuali kamu ganti routing library.
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
