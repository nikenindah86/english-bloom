

## Plan: Indonesian Attendance Statuses + Rekap Bulanan

### 1. Change Attendance Statuses to Indonesian (4 statuses)

Current: `present`, `absent`, `late`
New: `hadir`, `izin`, `sakit`, `alpha`

**Files to update:**

| File | Changes |
|------|---------|
| `src/pages/AdminAttendance.tsx` | Change `StudentRow.status` type to 4 Indonesian statuses. Update `statusColors` map. Update buttons to show Hadir/Izin/Sakit/Alpha. Default status → `"hadir"`. Update day names to Indonesian. |
| `src/pages/AdminAttendanceHistory.tsx` | Update `statusIcon` for 4 statuses (✓=Hadir, I=Izin, S=Sakit, A=Alpha). Update summary columns (H/I/S/A). Update CSV export with new status codes. Update attendance rate calculation (hadir counts as present). |
| `src/pages/AdminGradeOverview.tsx` | Change `status === "present"` → `status === "hadir"` on line 142. |
| `src/components/student/PassingGradeCard.tsx` | Change `.eq("status", "present")` → `.eq("status", "hadir")` on line 87. |

### 2. Rekap Daftar Hadir Bulanan (already exists, enhance)

The `AdminAttendanceHistory.tsx` page already has an Excel-like attendance table with CSV export. Changes needed:
- Update status labels/icons for 4 Indonesian statuses
- Add Izin (I) and Sakit (S) summary columns alongside Hadir (H) and Alpha (A)
- CSV export updated accordingly

### 3. Rekap Jurnal Mengajar (already exists)

Already present in `AdminAttendanceHistory.tsx` with Excel-like table and CSV download. No structural changes needed beyond what's already there.

### Status Color Map

```text
hadir  → green (emerald)
izin   → blue
sakit  → amber/yellow
alpha  → red
```

### No Database Migration Needed

The `attendance.status` column is `text` type — no schema change required. Just updating the stored values going forward.

### Important Note

Existing data in the database still uses `present/absent/late`. The history view should handle both old and new values gracefully during the transition period.

