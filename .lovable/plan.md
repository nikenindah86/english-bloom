

## Plan: Make All Admin Pages Fully Responsive on Mobile

### Problem Areas Identified

After reviewing all admin pages, here are the specific mobile responsiveness issues:

1. **AdminAssessments** — Tabs row with "Formative-Summative" / "TKA" + button crammed on one line; long tab labels overflow on small screens
2. **AdminSchedule** — Filter dropdown has fixed `w-48` that may not fit; header row is tight
3. **AdminLessonPlans** — Filter dropdown `w-48` fixed width; dialog has `grid-cols-2` and `grid-cols-3` that don't stack on mobile; dialog `max-w-2xl` with nested grids
4. **AdminManualGrades** — Spreadsheet table with `min-w-[600px]` is fine (scrollable), but the header with `w-48` dropdown can be tight; the sticky columns may clash on small screens
5. **AdminQuizzes** — Header row with ApiKeyManager + New Quiz button; quiz dialog `grid-cols-2` doesn't stack
6. **AdminClassDetail** — Join code section buttons can wrap awkwardly; header row with Archive button
7. **AdminAttendance** — Uses `grid-cols-2` for class/date controls which is fine, but journal section may have issues
8. **AdminMaterials** — Dialog uses `grid-cols-2` which doesn't stack on mobile
9. **TkaBuilder** — Step 2 basket form has multiple selectors in a row; outline table in Step 3 may overflow
10. **MobileBottomNav** — "Assessments" not in bottom nav or "More" menu

### Changes

| File | Change |
|------|--------|
| `src/pages/AdminAssessments.tsx` | Stack tabs + button vertically on mobile (`flex-col sm:flex-row`). Shorten tab labels on mobile. Make formative dialog responsive (`max-w-2xl` → full-width on mobile). |
| `src/pages/AdminQuizzes.tsx` | Stack header buttons on mobile. Make quiz dialog grid responsive (`grid-cols-1 sm:grid-cols-2`). |
| `src/pages/AdminSchedule.tsx` | Make filter dropdown full-width on mobile (`w-full sm:w-48`). |
| `src/pages/AdminLessonPlans.tsx` | Make filter `w-full sm:w-48`. Dialog grids: `grid-cols-1 sm:grid-cols-2` and `grid-cols-1 sm:grid-cols-3`. |
| `src/pages/AdminManualGrades.tsx` | Make class dropdown `w-full sm:w-48`. Stack header on mobile. |
| `src/pages/AdminMaterials.tsx` | Dialog grid `grid-cols-1 sm:grid-cols-2`. |
| `src/pages/AdminClassDetail.tsx` | Make join code section stack on mobile. Wrap header buttons. |
| `src/pages/AdminAttendance.tsx` | Ensure attendance table and journal sections are scrollable/stackable. |
| `src/components/admin/TkaBuilder.tsx` | Make basket form fields stack on mobile. Outline table scrollable with `overflow-x-auto`. |
| `src/components/MobileBottomNav.tsx` | Add "Assessments" to admin bottom nav or to the "More" menu items. |

### Approach

The fixes are purely CSS/layout adjustments:
- Replace fixed widths (`w-48`) with responsive (`w-full sm:w-48`)
- Replace `grid-cols-2`/`grid-cols-3` with `grid-cols-1 sm:grid-cols-2` etc.
- Add `flex-wrap gap-2` to header rows with multiple buttons
- Ensure all dialogs work on small screens (full-width on mobile)
- Add `overflow-x-auto` to tables/outlines
- Stack tab bars + action buttons vertically on mobile

No logic changes, no database changes — purely responsive layout fixes across ~10 files.

