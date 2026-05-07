// ============================================================
// src/routes/index.tsx — Route halaman utama "/"
// Hanya merender komponen Photobook.
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import Photobook from "@/components/Photobook";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <Photobook />;
}
