

## Problem

Tombol "Sign In" dan "Create Account" di landing page terlalu kecil pada tampilan mobile — tingginya hanya `h-11` (44px) dari size `lg`, dan padding/font kurang besar untuk jari di layar kecil.

## Plan

Edit `src/pages/Index.tsx` — buat tombol lebih besar dan nyaman di mobile:

1. **Tambah tinggi tombol** — override ke `h-14` (56px) dengan `text-lg` dan `rounded-xl` agar lebih bold dan mudah di-tap
2. **Pastikan layout tetap stacked (kolom)** pada mobile — hapus `sm:flex-row` agar tombol selalu full-width dan vertikal, lebih nyaman di mobile
3. **Tambah gap** antar tombol dari `gap-3` ke `gap-4`

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Update button container and button classes for bigger, mobile-friendly sizing |

