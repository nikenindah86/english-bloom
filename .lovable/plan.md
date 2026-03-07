

## Plan: CSV/Excel Export for Report Pages

### Overview

Create a reusable CSV download utility and add export buttons to pages that contain tabular report data.

### Utility: `src/lib/csvExport.ts`

A helper function that takes headers (string[]) and rows (string[][]), generates a CSV string with BOM (for Excel compatibility with Indonesian characters), and triggers a browser download with a given filename.

### Pages to Add Export Buttons

| Page | What Gets Exported |
|------|-------------------|
| **AdminAttendanceHistory** | Attendance table: Student Name + date columns + H/A/L/% summary. Second export for Teaching Journal table. |
| **AdminGradeOverview** | Full grade table: Student Name + individual quiz/assessment/manual scores + averages + attendance % + weighted total + status |
| **AdminManualGrades** | Manual grades spreadsheet: Student Name + each category column scores |
| **AdminStudents** | Student roster: Name, Class, Gender, Place/Date of Birth, Phone, Parent Name, Address |

### Implementation Per Page

1. Add a `Download CSV` button (with `Download` icon from lucide) next to filters
2. On click, map the current computed `rows` data into CSV-compatible string arrays using the same column structure visible in the table
3. Call the export utility with an appropriate filename like `Kehadiran_ClassName_March2026.csv`

### Files

| File | Change |
|------|--------|
| `src/lib/csvExport.ts` | **New** — reusable `downloadCSV(headers, rows, filename)` |
| `src/pages/AdminAttendanceHistory.tsx` | Add 2 export buttons (attendance + journal) |
| `src/pages/AdminGradeOverview.tsx` | Add export button for grade table |
| `src/pages/AdminManualGrades.tsx` | Add export button for manual grades |
| `src/pages/AdminStudents.tsx` | Add export button for student roster |

No database changes needed.

