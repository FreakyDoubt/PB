# Photobook 📸

Aplikasi photobook untuk kenangan bersama teman-teman.

---

## Setup Awal (sekali saja)

### 1. Clone & install

```bash
npm install
```

### 2. File `.env` sudah terisi — tinggal pakai

### 3. Buat tabel di Supabase

Buka [SQL Editor Supabase](https://supabase.com/dashboard/project/epxinttocihmvbgtzadh/sql) lalu jalankan:

```sql
-- Tabel users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabel halaman photobook
CREATE TABLE photobook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  page_index int NOT NULL,
  title text,
  date text,
  description text,
  photos jsonb,
  sticker text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page_index)
);

-- Tabel request reset password
CREATE TABLE password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  recovery_code text,
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz
);
```

---

## Alur Akun User

- **Daftar**: user buka app → klik "Daftar" → isi username + password
- **Login**: username + password
- **Lupa password**:
  1. User klik "Lupa Password" → isi username → klik kirim
  2. Request masuk ke tabel `password_reset_requests` (status: pending)
  3. **Kamu** buka Supabase Dashboard → lihat tabel `password_reset_requests`
  4. Approve: update `recovery_code` = kode 8 huruf, `status` = 'approved'
  5. Kirim kode ke user via WA/chat
  6. User klik "Sudah punya kode?" → isi username + kode + password baru

### Cara approve reset password (SQL):

```sql
-- Lihat semua request pending
SELECT * FROM password_reset_requests WHERE status = 'pending';

-- Approve dan set kode (ganti id dan kode sesuai kebutuhan)
UPDATE password_reset_requests
SET recovery_code = 'KODE8HURUF',
    status = 'approved',
    approved_at = now()
WHERE id = 'uuid-request-di-sini';
```

---

## Deploy ke Vercel

1. Push repo ke GitHub (file `.env` sudah di `.gitignore` — jangan di-push)
2. Import di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel Dashboard → Settings → Environment Variables:
   - `VITE_SUPABASE_URL` = `https://epxinttocihmvbgtzadh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (anon key kamu)
4. Deploy!

---

## Struktur File

| File | Fungsi |
|------|--------|
| `src/components/Photobook.tsx` | Komponen utama buku |
| `src/components/LoginPanel.tsx` | Login / Register / Reset password |
| `src/lib/auth.ts` | Logic semua autentikasi |
| `src/lib/db.ts` | Load/save halaman ke Supabase |
| `src/lib/supabase.ts` | Konfigurasi Supabase + SQL schema |
| `src/styles.css` | Semua style + warna |
