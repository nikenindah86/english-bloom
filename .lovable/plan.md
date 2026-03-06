
Masalah yang terlihat dari codebase dan screenshot:

1. Route deploy Netlify masih 404 untuk URL langsung seperti `/student` karena aplikasi pakai `BrowserRouter`, tapi saat ini di repo **tidak ada**:
   - `netlify.toml`
   - `public/_redirects`
2. Perubahan tombol mobile yang sempat terlihat di preview belum ada di source saat ini (`src/pages/Index.tsx` masih versi lama), jadi wajar jika domain deploy tidak ikut berubah.

Rencana implementasi:

1. Tambahkan konfigurasi rewrite SPA di root project lewat `netlify.toml`
2. Tambahkan fallback kedua di `public/_redirects` agar file ikut tercopy ke `dist`
3. Re-apply perubahan UI tombol mobile di landing page (`src/pages/Index.tsx`) supaya source of truth sama dengan preview
4. Validasi routing React tetap benar dan tidak ubah struktur route existing
5. Setelah deploy, verifikasi:
   - buka `/` (cek tombol sudah besar di mobile)
   - buka `/student` langsung dari address bar (harus load app, bukan 404 Netlify)

File yang akan diubah:

| File | Perubahan |
|---|---|
| `netlify.toml` (new) | Build config + SPA redirect `/* -> /index.html (200)` |
| `public/_redirects` (new) | Fallback redirect rule `/* /index.html 200` |
| `src/pages/Index.tsx` | Tombol Sign In/Create Account: lebih tinggi, lebih besar, stacked di mobile |

Detail teknis:

- `src/App.tsx` sudah menggunakan `BrowserRouter`, jadi server harus selalu serve `index.html` untuk deep link.
- Route yang valid sekarang untuk student adalah `/student`, `/student/materials`, `/student/quizzes`, `/student/quiz/:id`, `/student/grades`.
- Jika nanti akses `/student/profile`, app akan masuk ke route `*` (NotFound) kecuali kita tambah route khusus profile.
