

## Plan: Gamified Leaderboard, Class Selector, and Attendance Redesign

### Overview
Six changes across 3 pages: add a class leaderboard to the student dashboard, add a class selector to the student profile, and redesign the admin attendance page to be class-specific.

---

### 1. Leaderboard Component on Student Dashboard

**File:** `src/pages/StudentDashboard.tsx`

Add a new "Class Leaderboard" section after the Progress Card with two tabs using the existing `Tabs` component:

- **Tab "Top Scores"**: Query `quiz_submissions` joined with `profiles` where `profiles.class_id` matches the current student's `class_id`. Calculate average score per student, sort descending, limit 10.
- **Tab "Top Attendance"**: Query `attendance` joined with `profiles` for same class. Count rows where `status = 'present'`, sort descending, limit 10.

Visual design:
- Glassmorphism card with `Tabs`/`TabsList`/`TabsContent`
- Top 3 get crown/medal icons (gold `#FFD700`, silver `#C0C0C0`, rose-gold `#B76E79`)
- Each row shows rank number, avatar (first letter fallback), full name, score/days
- Current user's row highlighted with `bg-lavender/30` or `bg-pink-50`
- Fade-in animation on tab switch

Data fetching: On load, fetch the student's own `class_id` from `profiles`, then run two queries client-side to build both leaderboards. If student has no class, show a prompt to select one in Profile.

---

### 2. Class Selector in Student Profile

**File:** `src/pages/StudentProfile.tsx`

- Add `class_id` to the profile state
- Fetch all classes from `classes` table on mount
- Add a `Select` dropdown labeled "Class" between the Full Name and Place of Birth fields
- On save, include `class_id` in the update payload

No database migration needed — `profiles.class_id` column already exists.

---

### 3. Redesign Admin Attendance Page

**File:** `src/pages/AdminAttendance.tsx`

Complete rewrite with class-specific, session-based attendance:

- **Top section**: Two controls side by side:
  - `Select` dropdown to choose a class (fetched from `classes` table)
  - Date picker input for lesson date
- **Middle section**: Once both are selected, fetch students where `profiles.class_id` matches the selected class. Display each student with Present/Absent/Late chip buttons (existing style).
- **Bottom section**: "Save Attendance" button that batch upserts all attendance records at once (using `class_id` in the insert). Show a toast on success.

Key change: attendance records now include `class_id` when inserted. Students are filtered by their `class_id` in profiles, not by querying all students globally.

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/StudentDashboard.tsx` | Add leaderboard section with Tabs (Top Scores / Top Attendance) |
| `src/pages/StudentProfile.tsx` | Add class selector dropdown, save `class_id` |
| `src/pages/AdminAttendance.tsx` | Redesign: class dropdown + date picker + batch save |

No database migrations needed — all required columns (`profiles.class_id`, `attendance.class_id`) and tables already exist.

