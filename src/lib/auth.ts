// ============================================================
// src/lib/auth.ts — Logic autentikasi
//
// Fitur:
//   - register()     : daftar akun baru (username + password)
//   - login()        : masuk dengan username + password
//   - logout()       : keluar, hapus session
//   - getSession()   : ambil session aktif
//   - requestReset() : minta reset password → notif email ke admin
//   - useRecovery()  : pakai kode recovery dari admin untuk reset pass
//
// Session disimpan di sessionStorage (hilang saat tab ditutup).
// ============================================================

import { supabase } from "./supabase";

const SESSION_KEY = "photobook_session";

export type Session = {
  userId: string;
  username: string;
};

// ── Hash password dengan SHA-256 (Web Crypto API bawaan browser) ──
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Generate kode recovery random 8 karakter ──────────────────────
export function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa karakter ambigu
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ============================================================
// register — daftarkan user baru
// Return: null kalau berhasil, string error kalau gagal
// ============================================================
export async function register(
  username: string,
  password: string
): Promise<string | null> {
  // Cek username sudah dipakai
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .single();

  if (existing) return "Username sudah dipakai, coba yang lain.";

  const hash = await hashPassword(password);

  const { error } = await supabase.from("users").insert({
    username: username.toLowerCase().trim(),
    password_hash: hash,
  });

  if (error) return "Gagal mendaftar, coba lagi.";
  return null;
}

// ============================================================
// login — masuk dengan username + password
// Return: Session kalau berhasil, null kalau gagal
// ============================================================
export async function login(
  username: string,
  password: string
): Promise<Session | null> {
  const hash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", username.toLowerCase().trim())
    .eq("password_hash", hash)
    .single();

  if (error || !data) return null;

  const session: Session = { userId: data.id, username: data.username };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// ============================================================
// logout — hapus session
// ============================================================
export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ============================================================
// getSession — ambil session aktif (kalau ada)
// ============================================================
export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

// ============================================================
// requestReset — minta reset password
//
// Alur:
//   1. User klik "Lupa Password", isi username
//   2. Fungsi ini buat record di tabel password_reset_requests
//   3. Admin (kamu) dapat notif email via Supabase webhook / trigger
//   4. Admin approve & generate kode di dashboard Supabase
//   5. User pakai kode itu untuk reset password (useRecovery)
//
// Return: null kalau berhasil, string error kalau gagal
// ============================================================
export async function requestReset(username: string): Promise<string | null> {
  // Cek username ada
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .single();

  if (!user) return "Username tidak ditemukan.";

  // Cek apakah sudah ada request pending
  const { data: existing } = await supabase
    .from("password_reset_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (existing) return "Permintaan reset sudah dikirim, tunggu ya!";

  // Buat request baru
  const { error } = await supabase.from("password_reset_requests").insert({
    user_id: user.id,
    username: username.toLowerCase().trim(),
    status: "pending",
  });

  if (error) return "Gagal mengirim permintaan, coba lagi.";
  return null;
}

// ============================================================
// useRecovery — pakai kode recovery untuk reset password
//
// Alur:
//   1. Admin approve request di Supabase, isi kolom recovery_code
//      dan set status = 'approved'
//   2. Admin kirim kode ke user (via chat/WA)
//   3. User masukkan kode + password baru
//   4. Fungsi ini verifikasi kode, update password, tandai request sebagai 'used'
//
// Return: null kalau berhasil, string error kalau gagal
// ============================================================
export async function useRecovery(
  username: string,
  recoveryCode: string,
  newPassword: string
): Promise<string | null> {
  // Cari request yang approved dengan kode yang cocok
  const { data: request } = await supabase
    .from("password_reset_requests")
    .select("id, user_id")
    .eq("username", username.toLowerCase().trim())
    .eq("recovery_code", recoveryCode.toUpperCase().trim())
    .eq("status", "approved")
    .single();

  if (!request) return "Kode recovery tidak valid atau sudah dipakai.";

  // Update password user
  const newHash = await hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", request.user_id);

  if (updateError) return "Gagal update password, coba lagi.";

  // Tandai request sebagai sudah dipakai
  await supabase
    .from("password_reset_requests")
    .update({ status: "used" })
    .eq("id", request.id);

  return null;
}
