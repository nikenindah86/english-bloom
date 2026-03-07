

## Plan: Add Timetable Grid View (Keep Existing Card View)

### Approach

Add a **view toggle** (Card / Timetable) so teachers can switch between the existing grouped card view and a new Excel-like timetable grid. Both views use the same data and filters.

### Changes to `src/pages/AdminSchedule.tsx`

1. **Add view toggle state**: `viewMode` — `"cards"` (default) or `"timetable"`
2. **Add toggle buttons** next to the Add button (two small icon buttons: `LayoutList` for cards, `Table2` for timetable)
3. **Keep existing card view** exactly as-is, shown when `viewMode === "cards"`
4. **Add timetable grid** shown when `viewMode === "timetable"`:
   - Rows = unique time slots (sorted), Columns = days (Senin–Sabtu)
   - Cells show subject + class name; multiple entries stacked
   - Colored background for filled cells, "—" for empty
   - Hover delete button on each entry
   - Wrapped in `ScrollArea` + horizontal `ScrollBar`
5. **Add CSV export button** visible in timetable view — exports flat list (Hari, Jam, Mata Pelajaran, Kelas)
6. **Use Indonesian day names** in timetable: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu

### Files

| File | Change |
|------|--------|
| `src/pages/AdminSchedule.tsx` | Add view toggle + timetable grid view + CSV export |

No database changes needed.

