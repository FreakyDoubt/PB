// ============================================================
// src/lib/db.ts — Operasi database untuk data photobook
//
// Semua fungsi di sini berkomunikasi dengan tabel Supabase.
// Import dan pakai fungsi ini dari komponen yang butuh data.
//
// Cara ubah tampilan: tidak perlu ubah file ini.
// Kalau mau ubah struktur data / kolom, sesuaikan juga tabel Supabase.
// ============================================================

import { supabase } from "./supabase";
import type { PhotobookPageRow } from "./supabase";

// Tipe data halaman yang dipakai di komponen React
export type Photo = { src: string; rot: number; caption: string };
export type Page = {
  title: string;
  date: string;
  description: string;
  photos: Photo[];
  sticker: string;
};

// ============================================================
// loadPages: ambil semua halaman milik user dari database
// Return: array Page yang sudah diurutkan berdasarkan page_index
// ============================================================
export async function loadPages(userId: string): Promise<Page[] | null> {
  const { data, error } = await supabase
    .from("photobook_pages")
    .select("*")
    .eq("user_id", userId)
    .order("page_index", { ascending: true });

  if (error) {
    console.error("loadPages error:", error);
    return null;
  }

  // Kalau belum ada data, return null (supaya komponen pakai DEFAULT_PAGES)
  if (!data || data.length === 0) return null;

  // Map dari database row ke format Page yang dipakai React
  return (data as PhotobookPageRow[]).map((row) => ({
    title: row.title,
    date: row.date,
    description: row.description,
    photos: row.photos,
    sticker: row.sticker,
  }));
}

// ============================================================
// savePages: simpan semua halaman user ke database (upsert)
// Dipanggil setiap kali user mengubah konten halaman
// ============================================================
export async function savePages(userId: string, pages: Page[]): Promise<void> {
  // Konversi array Page ke format row database
  const rows = pages.map((page, index) => ({
    user_id: userId,
    page_index: index,
    title: page.title,
    date: page.date,
    description: page.description,
    photos: page.photos,
    sticker: page.sticker,
    updated_at: new Date().toISOString(),
  }));

  // Upsert: insert kalau belum ada, update kalau sudah ada
  // onConflict berdasarkan kombinasi user_id + page_index (unique constraint)
  const { error } = await supabase
    .from("photobook_pages")
    .upsert(rows, { onConflict: "user_id,page_index" });

  if (error) {
    console.error("savePages error:", error);
  }
}

// ============================================================
// resetPages: hapus semua halaman user (untuk tombol "reset buku")
// ============================================================
export async function resetPages(userId: string): Promise<void> {
  const { error } = await supabase
    .from("photobook_pages")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("resetPages error:", error);
  }
}
