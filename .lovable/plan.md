

## Masalah

1. Halaman **Classes** (admin) dan **Profile** (student) belum dibuat — bukan tersembunyi, memang belum ada kodenya.
2. Bottom navigation admin sudah 6 item, menambah lagi akan terlalu sempit di mobile.

## Rencana

### 1. Buat halaman Admin Classes (`/admin/classes`)

Halaman untuk guru membuat dan mengelola kelas. Fitur:
- Daftar kelas yang dibuat guru
- Tombol buat kelas baru (nama, deskripsi)
- Lihat daftar siswa per kelas

**Database migration:**
- Tabel `classes` (id, teacher_id, name, description, created_at)
- Tabel `class_members` (id, class_id, student_id, joined_at)
- RLS: guru hanya akses kelas miliknya, siswa hanya lihat kelas yang diikuti

### 2. Buat halaman Student Profile (`/student/profile`)

Halaman biodata siswa: nama lengkap, tempat/tanggal lahir, gender, alamat, telepon, nama wali. Bisa edit sendiri.

### 3. Perbaiki navigasi agar tidak penuh

**Admin bottom nav** — gunakan pendekatan "More" menu:
- Tampilkan 5 item utama: Home, Students, Classes, Materials, Quizzes
- Item ke-6 jadi tombol "More" (ikon titik tiga) yang membuka menu popup berisi: Grading, Attendance
- Ini menjaga bottom nav tetap nyaman di mobile

**Student bottom nav** — tambahkan Profile sebagai item ke-5:
- Home, Materials, Quizzes, Grades, Profile (ikon User)
- 5 item masih muat dengan baik di mobile

### 4. Route & wiring

| File | Perubahan |
|------|-----------|
| **Migration SQL** | Buat tabel `classes` dan `class_members` dengan RLS |
| `src/pages/AdminClasses.tsx` (new) | Halaman kelola kelas |
| `src/pages/StudentProfile.tsx` (new) | Halaman biodata siswa |
| `src/components/admin/AdminLayout.tsx` | Ubah bottom nav: 5 item + "More" popover |
| `src/components/student/StudentLayout.tsx` | Tambah item Profile di nav |
| `src/App.tsx` | Tambah route `/admin/classes` dan `/student/profile` |

### Detail teknis: Admin "More" menu

Bottom nav admin akan menampilkan 5 ikon + 1 tombol "More" yang menggunakan Popover dari radix. Saat di-tap, muncul menu kecil ke atas berisi Grading dan Attendance. Ini pattern umum di mobile apps (seperti Instagram, YouTube).

