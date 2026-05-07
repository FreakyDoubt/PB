// ============================================================
// src/components/LoginPanel.tsx — Panel Login / Register / Reset Password
//
// Ada 4 tampilan (view):
//   "login"    — form masuk (default)
//   "register" — form daftar akun baru
//   "forgot"   — form minta reset password (kirim notif ke admin)
//   "recovery" — form masukkan kode recovery dari admin
//
// Untuk ubah tampilan/warna: cari komentar STYLE di bawah
// Untuk ubah teks: ubah langsung di JSX
// Untuk ubah logic: lihat src/lib/auth.ts
// ============================================================

import { useState } from "react";
import { login, register, requestReset, useRecovery } from "@/lib/auth";

type View = "login" | "register" | "forgot" | "recovery";

type Props = {
  onLogin: (username: string, userId: string) => void;
};

export default function LoginPanel({ onLogin }: Props) {
  const [view, setView] = useState<View>("login");

  return (
    // STYLE: background halaman login — sama dengan warm-bg di Photobook
    <div className="warm-bg min-h-screen flex flex-col items-center justify-center px-4">

      {/* Judul aplikasi */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-serif text-primary tracking-wide">Photobook</h1>
        <p className="text-muted-foreground mt-2 text-sm">kenangan kita bersama 📸</p>
      </div>

      {/* Kotak form — konten berganti sesuai view */}
      {/* STYLE: kotak putih — ubah max-w-sm untuk lebar, ubah px/py untuk padding */}
      <div
        className="w-full max-w-sm bg-card rounded-2xl px-8 py-9"
        style={{ boxShadow: "0 12px 40px oklch(0.3 0.08 40 / 0.18)" }}
      >
        {view === "login"    && <LoginForm    onLogin={onLogin} onSwitch={setView} />}
        {view === "register" && <RegisterForm onLogin={onLogin} onSwitch={setView} />}
        {view === "forgot"   && <ForgotForm   onSwitch={setView} />}
        {view === "recovery" && <RecoveryForm onSwitch={setView} />}
      </div>
    </div>
  );
}

// ── Shared UI helpers ────────────────────────────────────────

// Input field dengan label
function Field({
  label, type = "text", value, onChange, placeholder, disabled,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === "password" ? "current-password" : undefined}
        className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground
                   text-sm focus:outline-none focus:ring-2 focus:ring-primary/50
                   disabled:opacity-60 transition"
      />
    </div>
  );
}

// Tombol utama submit
function SubmitBtn({ label, loading, disabled }: { label: string; loading: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                 hover:opacity-90 active:scale-95 transition disabled:opacity-60"
    >
      {loading ? "Mohon tunggu…" : label}
    </button>
  );
}

// Pesan error
function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive text-center">{msg}</p>;
}

// Pesan sukses
function SuccessMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="text-sm text-green-600 text-center">{msg}</p>;
}

// ── Form Login ───────────────────────────────────────────────
function LoginForm({
  onLogin, onSwitch,
}: { onLogin: Props["onLogin"]; onSwitch: (v: View) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setLoading(true);
    const session = await login(username, password);
    setLoading(false);
    if (!session) { setError("Username atau password salah."); return; }
    onLogin(session.username, session.userId);
  };

  return (
    <>
      <h2 className="text-xl font-serif text-foreground mb-6 text-center">Masuk</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" value={username} onChange={setUsername} placeholder="username kamu" disabled={loading} />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" disabled={loading} />
        <ErrorMsg msg={error} />
        <SubmitBtn label="Masuk" loading={loading} />
      </form>
      <div className="mt-5 flex flex-col items-center gap-2 text-xs text-muted-foreground">
        <span>
          Belum punya akun?{" "}
          <button onClick={() => onSwitch("register")} className="text-primary underline">
            Daftar
          </button>
        </span>
        <button onClick={() => onSwitch("forgot")} className="underline hover:text-foreground">
          Lupa password?
        </button>
      </div>
    </>
  );
}

// ── Form Register ────────────────────────────────────────────
function RegisterForm({
  onLogin, onSwitch,
}: { onLogin: Props["onLogin"]; onSwitch: (v: View) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    const err = await register(username, password);
    if (err) { setLoading(false); setError(err); return; }

    // Langsung login setelah register berhasil
    const { login: loginFn } = await import("@/lib/auth");
    const session = await loginFn(username, password);
    setLoading(false);
    if (!session) { setError("Daftar berhasil tapi gagal login, coba login manual."); return; }
    onLogin(session.username, session.userId);
  };

  return (
    <>
      <h2 className="text-xl font-serif text-foreground mb-6 text-center">Daftar Akun</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" value={username} onChange={setUsername} placeholder="buat username unik" disabled={loading} />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="minimal 6 karakter" disabled={loading} />
        <Field label="Konfirmasi Password" type="password" value={confirm} onChange={setConfirm} placeholder="ulangi password" disabled={loading} />
        <ErrorMsg msg={error} />
        <SubmitBtn label="Daftar" loading={loading} />
      </form>
      <p className="mt-5 text-xs text-muted-foreground text-center">
        Sudah punya akun?{" "}
        <button onClick={() => onSwitch("login")} className="text-primary underline">
          Masuk
        </button>
      </p>
    </>
  );
}

// ── Form Lupa Password ───────────────────────────────────────
// User isi username → kirim notif ke admin → admin approve & kirim kode
function ForgotForm({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!username.trim()) { setError("Masukkan username kamu."); return; }

    setLoading(true);
    const err = await requestReset(username);
    setLoading(false);

    if (err) { setError(err); return; }
    setSuccess("Permintaan terkirim! Tunggu admin kasih kode recovery ya 😊");
  };

  return (
    <>
      <h2 className="text-xl font-serif text-foreground mb-2 text-center">Lupa Password</h2>
      <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
        Masukkan username kamu, admin akan dikirim notif dan kasih kode recovery.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" value={username} onChange={setUsername} placeholder="username kamu" disabled={loading || !!success} />
        <ErrorMsg msg={error} />
        <SuccessMsg msg={success} />
        {!success && <SubmitBtn label="Kirim Permintaan" loading={loading} />}
      </form>
      <div className="mt-5 flex flex-col items-center gap-2 text-xs text-muted-foreground">
        {success && (
          <button
            onClick={() => onSwitch("recovery")}
            className="py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Sudah punya kode? Masukkan di sini →
          </button>
        )}
        <button onClick={() => onSwitch("login")} className="underline hover:text-foreground">
          ← Kembali ke Login
        </button>
      </div>
    </>
  );
}

// ── Form Recovery ─────────────────────────────────────────────
// User masukkan kode dari admin + password baru
function RecoveryForm({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !code.trim() || !newPass.trim()) {
      setError("Semua field wajib diisi."); return;
    }
    if (newPass.length < 6) { setError("Password baru minimal 6 karakter."); return; }
    if (newPass !== confirm) { setError("Konfirmasi password tidak cocok."); return; }

    setLoading(true);
    const err = await useRecovery(username, code, newPass);
    setLoading(false);

    if (err) { setError(err); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center flex flex-col gap-4">
        <p className="text-4xl">✅</p>
        <p className="font-serif text-foreground">Password berhasil direset!</p>
        <button
          onClick={() => onSwitch("login")}
          className="py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition"
        >
          Login sekarang
        </button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-serif text-foreground mb-2 text-center">Reset Password</h2>
      <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
        Masukkan kode recovery yang dikirim admin.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Username" value={username} onChange={setUsername} placeholder="username kamu" disabled={loading} />
        <Field label="Kode Recovery" value={code} onChange={setCode} placeholder="contoh: A3BK9ZXM" disabled={loading} />
        <Field label="Password Baru" type="password" value={newPass} onChange={setNewPass} placeholder="minimal 6 karakter" disabled={loading} />
        <Field label="Konfirmasi Password Baru" type="password" value={confirm} onChange={setConfirm} placeholder="ulangi password baru" disabled={loading} />
        <ErrorMsg msg={error} />
        <SubmitBtn label="Reset Password" loading={loading} />
      </form>
      <p className="mt-5 text-xs text-muted-foreground text-center">
        <button onClick={() => onSwitch("login")} className="underline hover:text-foreground">
          ← Kembali ke Login
        </button>
      </p>
    </>
  );
}
