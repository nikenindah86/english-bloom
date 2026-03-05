

## Plan: Admin Sidebar, Manual Grading, dan Fitur Kelas ala Google Classroom

### 1. Admin Sidebar Navigation

Ganti bottom nav di `AdminLayout` dengan Sidebar menggunakan komponen `Sidebar` dari shadcn yang sudah tersedia. Sidebar akan berfungsi di desktop (persistent) dan mobile (collapsible offcanvas).

**Kategori menu:**

```text
MAIN
  ├── Dashboard (Home)
  
ACADEMIC
  ├── Classes
  ├── Students  
  ├── Materials
  ├── Quizzes

ASSESSMENT
  ├── Grading (quiz submissions)
  ├── Manual Grades (new)
  ├── Attendance
```

**File yang diubah:**
- `src/components/admin/AdminLayout.tsx` — Rewrite: hapus bottom nav, gunakan `SidebarProvider` + `Sidebar` + `SidebarTrigger`. Header tetap ada di atas konten utama.

---

### 2. Manual Grading (CRUD penilaian oleh guru)

Fitur baru: guru bisa membuat nilai manual (bukan dari quiz), misalnya untuk tugas, ujian offline, presentasi, dll.

**Database migration** — tabel baru `manual_grades`:
- `id` (uuid, PK)
- `student_id` (uuid, NOT NULL)
- `class_id` (uuid, nullable)
- `title` (text, NOT NULL) — nama tugas/ujian
- `score` (numeric, NOT NULL)
- `max_score` (numeric, default 100)
- `feedback` (text, nullable)
- `grade_date` (date, default CURRENT_DATE)
- `created_at` (timestamptz, default now())

RLS: Teacher full access, student can view own grades.

**File baru:**
- `src/pages/AdminManualGrades.tsx` — CRUD: daftar nilai, dialog tambah/edit (pilih student, class, judul, skor, feedback), hapus.

**File yang diubah:**
- `src/App.tsx` — tambah route `/admin/manual-grades`
- `src/pages/StudentGrades.tsx` — tampilkan manual grades di samping quiz grades

---

### 3. Brainstorm Fitur Kelas (Google Classroom-style)

Saat ini fitur kelas sangat basic (hanya nama + deskripsi + lihat student). Berikut fitur-fitur yang akan ditambahkan secara bertahap. **Dalam iterasi ini**, kita implementasi yang paling impactful:

**Akan diimplementasi sekarang:**
1. **Class Stream/Feed** — Halaman detail kelas (`/admin/classes/:id`) dengan tab: Stream (announcements per kelas), Students, dan Settings
2. **Class-specific Materials** — Tambah kolom `class_id` ke tabel `materials` agar materi bisa di-assign ke kelas tertentu
3. **Class-specific Quizzes** — Tambah kolom `class_id` ke tabel `quizzes` agar quiz bisa di-assign ke kelas tertentu
4. **Class Code / Join** — Tambah kolom `join_code` (6-char unique) ke `classes`, student bisa join via kode

**Direncanakan untuk iterasi selanjutnya (tidak sekarang):**
- Assignment/tugas terpisah dari quiz (dengan deadline, file submission)
- Komentar/diskusi di stream
- Jadwal pelajaran / calendar
- Notifikasi per kelas
- Arsip kelas

**Database migrations:**
- `materials`: tambah kolom `class_id` (uuid, nullable, FK ke classes)
- `quizzes`: tambah kolom `class_id` (uuid, nullable, FK ke classes)
- `classes`: tambah kolom `join_code` (text, unique)
- `manual_grades`: tabel baru (seperti di atas)

**File baru:**
- `src/pages/AdminClassDetail.tsx` — Detail kelas dengan tabs (Stream, Students, Materials, Quizzes)
- `src/pages/AdminManualGrades.tsx` — CRUD penilaian manual

**File yang diubah:**
- `src/components/admin/AdminLayout.tsx` — Sidebar
- `src/pages/AdminClasses.tsx` — Klik kelas navigasi ke detail, tampilkan join code
- `src/pages/AdminMaterials.tsx` — Tambah dropdown "Class" saat create/edit material
- `src/pages/AdminQuizzes.tsx` — Tambah dropdown "Class" saat create/edit quiz
- `src/pages/StudentProfile.tsx` — Tambah input "Join Class by Code"
- `src/pages/StudentMaterials.tsx` — Filter materials by student's class
- `src/pages/StudentQuizzes.tsx` — Filter quizzes by student's class
- `src/pages/StudentGrades.tsx` — Tampilkan manual grades juga
- `src/App.tsx` — Route baru `/admin/classes/:id`, `/admin/manual-grades`

---

### Summary Perubahan

| Area | Detail |
|------|--------|
| Migration | 4 perubahan: tabel `manual_grades`, kolom `class_id` di materials & quizzes, kolom `join_code` di classes |
| File baru | `AdminClassDetail.tsx`, `AdminManualGrades.tsx` |
| File diubah | `AdminLayout`, `AdminClasses`, `AdminMaterials`, `AdminQuizzes`, `StudentProfile`, `StudentMaterials`, `StudentQuizzes`, `StudentGrades`, `App.tsx` |
| Tidak diubah | Student dashboard, leaderboard, attendance (sudah class-aware) |

