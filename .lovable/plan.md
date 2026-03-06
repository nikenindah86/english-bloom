

## Analisis UX: Sidebar vs Icon Grid Menu di Mobile

### Perbandingan

| Aspek | Sidebar (Sekarang) | Icon Grid (Shopee-style) |
|-------|-------------------|------------------------|
| Discoverability | Tersembunyi di balik hamburger menu, user harus tap dulu | Semua menu langsung terlihat, sangat discoverable |
| Tap count | 2 tap (buka sidebar → pilih menu) | 1 tap langsung |
| Visual appeal | Standar, kurang menarik di mobile | Lebih menarik dengan icon berwarna-warni |
| Cocok untuk | App dengan banyak menu (10+) | App dengan 7-12 menu, pas untuk LMS ini |

### Rekomendasi UX

Pendekatan **hybrid** yang paling optimal untuk LMS ini:

1. **Desktop**: Tetap pakai sidebar (sudah bagus)
2. **Mobile**: Ganti sidebar dengan **icon grid menu di halaman Dashboard** + **bottom tab bar** untuk navigasi utama

Kenapa bukan murni Shopee-style? Karena Shopee adalah marketplace (browse-first), sedangkan LMS adalah task-oriented app. Jadi yang paling cocok:

- **Dashboard** menampilkan icon grid seperti referensi (semua menu terlihat langsung)
- **Bottom navigation bar** (fixed di bawah) dengan 4-5 menu utama untuk navigasi cepat antar halaman
- Sidebar **dihilangkan di mobile view**

### Rencana Implementasi

#### 1. Bottom Navigation Bar (Mobile Only)
Komponen baru `MobileBottomNav.tsx`:
- Fixed di bawah layar, hanya muncul di `< 768px`
- Student: Home, Materials, Quizzes, Grades, Profile (5 icon)
- Admin: Dashboard, Students, Quizzes, Grading, More (5 icon, "More" buka sheet dengan menu lainnya)

#### 2. Dashboard Icon Grid
Update `StudentDashboard.tsx` dan `AdminDashboard.tsx`:
- Tambahkan section icon grid di atas dashboard (mirip Shopee categories)
- Setiap icon punya warna background pastel berbeda
- Grid 4 kolom di mobile, icon + label

#### 3. Hide Sidebar di Mobile
Update `StudentLayout.tsx` dan `AdminLayout.tsx`:
- Sidebar hanya render di `>= 768px`
- SidebarTrigger (hamburger) dihilangkan di mobile
- Header tetap ada untuk user info + logout

### Files

| File | Change |
|------|--------|
| `src/components/MobileBottomNav.tsx` | New: bottom tab bar component |
| `src/components/student/StudentLayout.tsx` | Hide sidebar on mobile, add bottom nav |
| `src/components/admin/AdminLayout.tsx` | Hide sidebar on mobile, add bottom nav |
| `src/pages/StudentDashboard.tsx` | Add icon grid menu section |
| `src/pages/AdminDashboard.tsx` | Add icon grid menu section |

### UI Sketch (Mobile Dashboard)

```text
┌─────────────────────────┐
│  🎓 Student Portal  🔔 │
├─────────────────────────┤
│                         │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │📚│ │📝│ │📋│ │📅│  │
│  │Mat│ │Quiz││Asg│ │Sch│  │
│  └──┘ └──┘ └──┘ └──┘  │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │⭐│ │👤│ │🔔│        │
│  │Grd│ │Pro│ │Not│       │
│  └──┘ └──┘ └──┘       │
│                         │
│  [Dashboard content...] │
│                         │
├─────────────────────────┤
│ 🏠  📚  📝  ⭐  👤    │  ← Bottom nav
└─────────────────────────┘
```

