// ============================================================
// src/lib/supabase.ts — Konfigurasi Supabase client
//
// Env vars diambil dari .env (lokal) atau Vercel Environment Variables.
// Prefix VITE_ wajib agar Vite expose ke client-side.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diisi di .env!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// SQL SCHEMA — jalankan di Supabase SQL Editor sekali saja
// ============================================================
//
// CREATE TABLE users (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   username text UNIQUE NOT NULL,
//   password_hash text NOT NULL,
//   email text,                          -- opsional, untuk notif
//   created_at timestamptz DEFAULT now()
// );
//
// CREATE TABLE photobook_pages (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id uuid REFERENCES users(id) ON DELETE CASCADE,
//   page_index int NOT NULL,
//   title text,
//   date text,
//   description text,
//   photos jsonb,
//   sticker text,
//   updated_at timestamptz DEFAULT now(),
//   UNIQUE(user_id, page_index)
// );
//
// CREATE TABLE password_reset_requests (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id uuid REFERENCES users(id) ON DELETE CASCADE,
//   username text NOT NULL,
//   recovery_code text,                  -- diisi admin saat approve
//   status text DEFAULT 'pending',       -- pending | approved | used
//   requested_at timestamptz DEFAULT now(),
//   approved_at timestamptz
// );

export type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  email?: string;
  created_at: string;
};

export type ResetRequestRow = {
  id: string;
  user_id: string;
  username: string;
  recovery_code: string | null;
  status: "pending" | "approved" | "used";
  requested_at: string;
  approved_at: string | null;
};

export type PhotobookPageRow = {
  id: string;
  user_id: string;
  page_index: number;
  title: string;
  date: string;
  description: string;
  photos: Array<{ src: string; rot: number; caption: string }>;
  sticker: string;
  updated_at: string;
};
