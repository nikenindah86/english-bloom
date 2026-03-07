

## Plan: 3 Improvements — Scroll Bar, Archive Filter, Attendance History

### 1. Add Horizontal Scroll Bar to Grade Overview Table

The `Table` component wraps content in `overflow-auto` but the scrollbar isn't visible. Wrap the table area in a `ScrollArea` with horizontal `ScrollBar` so the scrollbar is always visible.

**File**: `src/pages/AdminGradeOverview.tsx`
- Replace the `<div className="overflow-x-auto">` wrapper with `<ScrollArea>` + `<ScrollBar orientation="horizontal" />` from the existing scroll-area component.

### 2. Filter Out Archived Classes from All Dropdowns

Several pages fetch classes without filtering `is_archived`. Add `.eq("is_archived", false)` to these queries:

| File | Line |
|------|------|
| `src/pages/AdminAttendance.tsx` | Line 50 |
| `src/pages/AdminGrading.tsx` | Line 65 |
| `src/pages/AdminAssessments.tsx` | Line 132 |
| `src/pages/AdminQuizzes.tsx` | Line 84 |
| `src/pages/AdminManualGrades.tsx` | Line 34 |
| `src/pages/AdminMaterials.tsx` | Line 51 |
| `src/pages/StudentProfile.tsx` | Line 30 |

Pages already filtering correctly: `AdminGradeOverview`, `AdminSchedule`, `AdminLessonPlans`, `AdminGradingConfig`, `AdminCourses`, `CreateAssignmentDialog`.

### 3. New Page: Attendance & Journal History (Excel-like View)

Create `src/pages/AdminAttendanceHistory.tsx` — an Excel-style table showing:

```text
[Class Filter] [Month/Date Range Picker]

┌────────────┬──────────┬──────────┬──────────┬─────────┬─────────┬─────────┐
│ Nama Siswa │ 01/03    │ 03/03    │ 05/03    │ 07/03   │ Present │ Att. %  │
├────────────┼──────────┼──────────┼──────────┼─────────┼─────────┼─────────┤
│ Ali        │ ✓        │ ✓        │ L        │ ✓       │ 3/4     │ 75%     │
│ Angelina   │ ✓        │ A        │ ✓        │ ✓       │ 3/4     │ 75%     │
└────────────┴──────────┴──────────┴──────────┴─────────┴─────────┴─────────┘

Teaching Journal History:
┌────────────┬──────────────────┬──────────────────────┬───────────┐
│ Tanggal    │ Jam Pelajaran    │ Topik                │ Catatan   │
├────────────┼──────────────────┼──────────────────────┼───────────┤
│ 01/03/2026 │ 07:00–08:00 ENG  │ Present Simple Tense │ ...       │
│ 03/03/2026 │ 09:00–10:00 ENG  │ Reading Comp.        │ ...       │
└────────────┴──────────────────┴──────────────────────┴───────────┘
```

**Data flow**:
- Fetch all `attendance` records for selected class within date range
- Get unique dates → become columns
- Rows = students, cells = status (✓/A/L for present/absent/late)
- Summary columns: total present, total absent, total late, attendance %
- Below: fetch `teaching_journals` for same class+range, display as a simple table

**Features**:
- Horizontal scroll with visible `ScrollBar`
- Sticky student name column
- Color-coded status cells (green ✓, red A, amber L)
- Summary row at bottom with class totals

**Files to create/modify**:

| File | Change |
|------|------|
| `src/pages/AdminAttendanceHistory.tsx` | **New** — full Excel-style attendance + journal history |
| `src/App.tsx` | Add route `/admin/attendance-history` |
| `src/components/admin/AdminLayout.tsx` | Add "Attendance History" nav link near Attendance |

No database changes needed.

