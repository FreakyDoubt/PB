// ============================================================
// src/components/Photobook.tsx — Komponen utama Photobook
//
// Komponen ini mengurus:
//   1. Cek session login (kalau belum login → tampilkan LoginPanel)
//   2. Load halaman dari database Supabase
//   3. Render buku dengan animasi flip halaman
//   4. Edit judul, deskripsi, foto, caption secara inline
//
// ── PANDUAN UBAH TAMPILAN ──────────────────────────────────
// • Judul aplikasi di header     → cari <h1> di komponen Photobook()
// • Warna tombol navigasi        → cari className di tombol Sebelumnya/Berikutnya
// • Tampilan kartu halaman       → komponen PageFace()
// • Tampilan belakang halaman    → komponen PageBack()
// • Animasi & layout buku        → src/styles.css bagian /* Photobook */
//
// ── PANDUAN UBAH LOGIC ────────────────────────────────────
// • Login / logout               → src/lib/auth.ts
// • Simpan / load database       → src/lib/db.ts
// • Konfigurasi Supabase         → src/lib/supabase.ts
// ============================================================

import { useEffect, useRef, useState } from "react";
import bear from "@/assets/sticker-bear.png";
import bunny from "@/assets/sticker-bunny.png";
import cat from "@/assets/sticker-cat.png";
import fox from "@/assets/sticker-fox.png";
import duck from "@/assets/sticker-duck.png";
import LoginPanel from "@/components/LoginPanel";
import { getSession, logout } from "@/lib/auth";
import { loadPages, savePages, resetPages } from "@/lib/db";
import type { Page } from "@/lib/db";

// ============================================================
// Stiker yang tersedia — array ini menentukan stiker tiap halaman
// Urutan: halaman 0→bear, 1→fox, 2→bunny, 3→cat, 4→duck, dst (looping)
// ============================================================
const STICKERS: Record<string, string> = { bear, bunny, cat, fox, duck };
const STICKER_CYCLE = ["bear", "fox", "bunny", "cat", "duck"];

// Helper foto placeholder dari picsum
const sample = (seed: string, w = 600, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ============================================================
// Halaman default — ditampilkan sebelum user pernah simpan data
// atau setelah reset buku
// ============================================================
const DEFAULT_PAGES: Page[] = [
  {
    title: "Pagi yang Hangat",
    date: "Januari 2025",
    description: "klik foto untuk mengganti, klik judul & deskripsi untuk mengubah ceritamu.",
    sticker: "bear",
    photos: [
      { src: sample("warm1"), rot: -3, caption: "secangkir kopi" },
      { src: sample("warm2"), rot: 2, caption: "cahaya jendela" },
      { src: sample("warm3"), rot: -1, caption: "buku favorit" },
    ],
  },
  {
    title: "Jalan Sore",
    date: "Februari 2025",
    description: "tulis cerita kecil tentang halaman ini di sini.",
    sticker: "fox",
    photos: [
      { src: sample("sun1"), rot: 2, caption: "langit jingga" },
      { src: sample("sun2"), rot: -2, caption: "trotoar sepi" },
      { src: sample("sun3"), rot: 3, caption: "bayang panjang" },
    ],
  },
  {
    title: "Hari Bersama",
    date: "Maret 2025",
    description: "tulis cerita kecil tentang halaman ini di sini.",
    sticker: "bunny",
    photos: [
      { src: sample("frd1"), rot: -2, caption: "tawa lepas" },
      { src: sample("frd2"), rot: 1, caption: "makan siang" },
      { src: sample("frd3"), rot: -3, caption: "jalan pulang" },
    ],
  },
  {
    title: "Tempat Kesayangan",
    date: "April 2025",
    description: "tulis cerita kecil tentang halaman ini di sini.",
    sticker: "cat",
    photos: [
      { src: sample("hm1"), rot: 3, caption: "sudut baca" },
      { src: sample("hm2"), rot: -1, caption: "tanaman kecil" },
      { src: sample("hm3"), rot: 2, caption: "jendela hangat" },
    ],
  },
  {
    title: "Liburan Kecil",
    date: "Mei 2025",
    description: "tulis cerita kecil tentang halaman ini di sini.",
    sticker: "duck",
    photos: [
      { src: sample("trv1"), rot: -2, caption: "pantai pagi" },
      { src: sample("trv2"), rot: 2, caption: "es kelapa" },
      { src: sample("trv3"), rot: -1, caption: "matahari turun" },
    ],
  },
];

// ============================================================
// Komponen utama Photobook
// ============================================================
export default function Photobook() {
  // ── State session ──────────────────────────────────────
  const [session, setSession] = useState(getSession());

  // ── State data buku ────────────────────────────────────
  const [pages, setPages] = useState<Page[]>(DEFAULT_PAGES);
  const [current, setCurrent] = useState(0); // indeks halaman aktif
  const [dbLoaded, setDbLoaded] = useState(false); // sudah selesai load dari DB?

  const total = pages.length;

  // ── Load data dari Supabase saat login ─────────────────
  useEffect(() => {
    if (!session) return;

    (async () => {
      const saved = await loadPages(session.userId);
      if (saved && saved.length > 0) {
        setPages(saved);
      }
      setDbLoaded(true);
    })();
  }, [session]);

  // ── Auto-save ke Supabase setiap kali pages berubah ────
  // Hanya save setelah data DB berhasil dimuat (hindari overwrite saat pertama load)
  useEffect(() => {
    if (!session || !dbLoaded) return;
    savePages(session.userId, pages);
  }, [pages, session, dbLoaded]);

  // ── Helper: update satu halaman ────────────────────────
  const updatePage = (i: number, patch: Partial<Page>) =>
    setPages((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  // ── Helper: update src foto di halaman tertentu ────────
  const updatePhoto = (pageIdx: number, photoIdx: number, src: string) =>
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === pageIdx
          ? { ...p, photos: p.photos.map((ph, j) => (j === photoIdx ? { ...ph, src } : ph)) }
          : p,
      ),
    );

  // ── Helper: update caption foto ───────────────────────
  const updateCaption = (pageIdx: number, photoIdx: number, caption: string) =>
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === pageIdx
          ? { ...p, photos: p.photos.map((ph, j) => (j === photoIdx ? { ...ph, caption } : ph)) }
          : p,
      ),
    );

  // ── Handler reset buku ────────────────────────────────
  const handleReset = async () => {
    if (!confirm("Reset semua halaman ke isi awal?")) return;
    if (session) await resetPages(session.userId);
    setPages(DEFAULT_PAGES);
    setCurrent(0);
    setDbLoaded(true); // tetap set true supaya auto-save jalan lagi
  };

  // ── Handler logout ────────────────────────────────────
  const handleLogout = () => {
    logout();
    setSession(null);
    setPages(DEFAULT_PAGES);
    setCurrent(0);
    setDbLoaded(false);
  };

  // ── Kalau belum login, tampilkan LoginPanel ────────────
  if (!session) {
    return (
      <LoginPanel
        onLogin={(username, userId) => setSession({ username, userId })}
      />
    );
  }

  // ── Render utama buku ─────────────────────────────────
  return (
    <div className="warm-bg min-h-screen flex flex-col items-center justify-center py-10 px-4">

      {/* ── Header ───────────────────────────────────── */}
      {/* Untuk ubah judul: ganti teks di <h1> */}
      <header className="text-center mb-6 w-full max-w-[min(960px,95vw)]">
        <div className="flex items-start justify-between">
          {/* Judul kiri */}
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-serif text-primary tracking-wide">
              Photobook
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              klik foto untuk upload • klik judul &amp; deskripsi untuk mengubah
            </p>
          </div>
          {/* Info user + tombol logout (kanan atas) */}
          <div className="flex flex-col items-end gap-1 pt-1">
            <span className="text-sm text-foreground/70 font-serif">
              Halo, <strong className="text-primary">{session.username}</strong> 👋
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ── Stage buku (perspektif 3D) ────────────────── */}
      {/* Untuk ubah ukuran buku: ubah maxWidth di bawah */}
      <div className="book-stage w-full" style={{ maxWidth: "min(960px, 95vw)" }}>
        <div className="book mx-auto relative" style={{ aspectRatio: "3 / 2", width: "100%" }}>

          {/* Render semua halaman (z-index menentukan tumpukan) */}
          {pages.map((page, i) => {
            const flipped = i < current;
            const z = flipped ? i : total - i;
            const stickerSrc = STICKERS[page.sticker] ?? STICKERS[STICKER_CYCLE[i % STICKER_CYCLE.length]];
            return (
              <div key={i} className={`page ${flipped ? "flipped" : ""}`} style={{ zIndex: z }}>
                <PageFace
                  page={page}
                  index={i}
                  stickerSrc={stickerSrc}
                  onChangeTitle={(title) => updatePage(i, { title })}
                  onChangeDescription={(description) => updatePage(i, { description })}
                  onChangePhoto={(photoIdx, src) => updatePhoto(i, photoIdx, src)}
                  onChangeCaption={(photoIdx, caption) => updateCaption(i, photoIdx, caption)}
                />
                <PageBack index={i} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Navigasi halaman ─────────────────────────── */}
      {/* Untuk ubah tampilan tombol: ubah className di tombol */}
      <div className="mt-8 flex items-center gap-6">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-5 py-2 rounded-full bg-primary text-primary-foreground
                     disabled:opacity-40 hover:scale-105 transition-transform shadow-md"
        >
          ← Sebelumnya
        </button>
        <span className="text-foreground font-serif">
          {Math.min(current + 1, total)} / {total}
        </span>
        <button
          onClick={() => setCurrent((c) => Math.min(total, c + 1))}
          disabled={current >= total}
          className="px-5 py-2 rounded-full bg-primary text-primary-foreground
                     disabled:opacity-40 hover:scale-105 transition-transform shadow-md"
        >
          Berikutnya →
        </button>
      </div>

      {/* ── Tombol reset buku ────────────────────────── */}
      <button
        onClick={handleReset}
        className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
      >
        reset buku
      </button>
    </div>
  );
}

// ============================================================
// PageFace — tampilan depan halaman buku
//
// Untuk ubah layout foto: ubah grid-cols-3 di className grid
// Untuk ubah padding halaman: ubah di .page-face di styles.css
// ============================================================
function PageFace({
  page,
  index,
  stickerSrc,
  onChangeTitle,
  onChangeDescription,
  onChangePhoto,
  onChangeCaption,
}: {
  page: Page;
  index: number;
  stickerSrc: string;
  onChangeTitle: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onChangePhoto: (photoIdx: number, src: string) => void;
  onChangeCaption: (photoIdx: number, v: string) => void;
}) {
  // Ref ke hidden file input untuk tiap slot foto
  const fileRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Handler upload file gambar — konversi ke base64 Data URL
  const handleFile = (photoIdx: number, file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChangePhoto(photoIdx, reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="page-face flex flex-col">

      {/* ── Baris judul + tanggal ── */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <input
          value={page.title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Judul halaman…"
          className="flex-1 bg-transparent text-2xl md:text-3xl font-serif text-primary
                     tracking-wide focus:outline-none border-b border-transparent
                     focus:border-primary/40"
        />
        <span className="text-xs md:text-sm text-muted-foreground italic shrink-0">
          {page.date}
        </span>
      </div>

      {/* ── Grid foto 3 kolom ── */}
      {/* Untuk ganti jumlah kolom: ubah grid-cols-3 */}
      <div className="grid grid-cols-3 gap-3 md:gap-5 flex-1 min-h-0">
        {page.photos.map((p, i) => (
          <figure
            key={i}
            className="photo-frame flex flex-col cursor-pointer group relative"
            style={{ transform: `rotate(${p.rot}deg)` }}
            title="Klik foto untuk ganti gambar"
          >
            {/* Gambar — klik untuk trigger file input */}
            <img
              src={p.src}
              alt=""
              loading="lazy"
              className="w-full flex-1 object-cover rounded-sm min-h-0"
              onClick={() => fileRefs.current[i]?.click()}
            />
            {/* Caption foto (editable) */}
            <input
              value={p.caption}
              onChange={(e) => onChangeCaption(i, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="judul foto…"
              className="text-center mt-2 font-serif text-[11px] md:text-xs
                         text-foreground/70 bg-transparent focus:outline-none
                         border-b border-transparent focus:border-primary/40"
            />
            {/* Hidden file input untuk upload */}
            <input
              ref={(el) => { fileRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleFile(i, e.target.files?.[0])}
            />
          </figure>
        ))}
      </div>

      {/* ── Textarea deskripsi halaman ── */}
      <textarea
        value={page.description}
        onChange={(e) => onChangeDescription(e.target.value)}
        placeholder="Tulis deskripsi halaman ini…"
        rows={3}
        className="mt-5 mb-4 w-full resize-none bg-transparent font-serif italic
                   text-sm md:text-base text-foreground/80 leading-snug
                   focus:outline-none border-t border-border/50 pt-3"
      />

      {/* ── Nomor halaman ── */}
      <span className="absolute bottom-2 right-4 text-[10px] text-muted-foreground/70 font-serif">
        — {index + 1} —
      </span>

      {/* ── Stiker ── */}
      {/* Untuk ubah ukuran stiker: ubah w-14 md:w-16 */}
      <img
        src={stickerSrc}
        alt=""
        aria-hidden
        width={64}
        height={64}
        className="sticker absolute -top-2 -right-2 w-14 md:w-16 h-auto pointer-events-none opacity-90"
        style={{ ["--rot" as string]: `${index % 2 === 0 ? -10 : 10}deg` }}
      />
    </div>
  );
}

// ============================================================
// PageBack — tampilan belakang halaman (terlihat saat halaman dibalik)
//
// Untuk ubah teks: ubah konten <p>
// ============================================================
function PageBack({ index }: { index: number }) {
  return (
    <div className="page-face page-back flex items-center justify-center">
      <p className="font-serif italic text-muted-foreground text-lg">
        … cerita berlanjut …
      </p>
      <span className="absolute bottom-3 left-6 text-xs text-muted-foreground font-serif">
        — {index + 1} —
      </span>
    </div>
  );
}
