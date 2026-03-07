

## Plan: Student Filters/Pagination + Class Student Profile Table with CSV Export

### 1. AdminStudents — Add Class Filter, Gender Filter, and Pagination

**File**: `src/pages/AdminStudents.tsx`

- Add a **class filter dropdown** (Select) to filter students by class, populated from the fetched class names
- Add a **gender filter dropdown** (All / Male / Female)
- Add **client-side pagination** (10 students per page) using the existing Pagination components from `src/components/ui/pagination.tsx`
- Filter chain: search → class filter → gender filter → paginate

### 2. AdminClassDetail — Excel-like Student Profile Table with CSV Export

**File**: `src/pages/AdminClassDetail.tsx`

In the "Students" tab, replace the simple name list with a comprehensive Excel-style table showing all student profile fields:

```text
┌────┬──────────────────┬──────────┬──────────────┬─────────────┬──────────┬──────────────┬──────────┐
│ No │ Nama             │ Gender   │ Tempat Lahir │ Tgl Lahir   │ Telepon  │ Orang Tua    │ Alamat   │
├────┼──────────────────┼──────────┼──────────────┼─────────────┼──────────┼──────────────┼──────────┤
│ 1  │ Alisa anaya      │ Female   │ Jakarta      │ 05/03/2010  │ 08123... │ Budi         │ Jl. ...  │
└────┴──────────────────┴──────────┴──────────────┴─────────────┴──────────┴──────────────┴──────────┘
```

Changes:
- Expand the `profiles` query in the `class-students` queryKey to fetch all profile fields (gender, place_of_birth, date_of_birth, phone, parent_name, address)
- Render as a horizontally scrollable `Table` with `ScrollArea` + `ScrollBar`
- Add a **Download CSV** button that exports the class student roster using `downloadCSV`
- Filename: `Profil_Siswa_{ClassName}.csv`

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminStudents.tsx` | Add class/gender filter dropdowns + pagination (10/page) |
| `src/pages/AdminClassDetail.tsx` | Replace student list with Excel-like table + CSV export |

No database changes needed.

