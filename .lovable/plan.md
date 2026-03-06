

## Plan: Excel-style Table Input for Manual Grades

### Current State
Manual grades uses a one-by-one dialog approach. User wants a spreadsheet-like table where they can quickly input grades for multiple students at once.

### Changes

**File: `src/pages/AdminManualGrades.tsx`** — Major rewrite

Add a new "Table Mode" alongside the existing single-entry dialog:

1. **Two modes toggle**: "Card View" (existing) and "Table Entry" (new), switched via Tabs at the top
2. **Table Entry mode**:
   - Select class filter and set shared fields (title, max score, date) at the top
   - Render an editable table with all students from the selected class as rows
   - Columns: Student Name (read-only), Score (editable input), Feedback (editable input)
   - Pre-fill with existing grades if they match the same title + date
   - "Save All" button at bottom to bulk upsert all rows with non-empty scores
3. **Card View**: Keep existing card list with single-entry dialog (no change)

### UI Layout (Table Mode)

```text
┌──────────────────────────────────────────────┐
│  [Class: ▼]  [Title: ____]  [Max: 100]      │
│  [Date: ____]                                │
├──────────────────────────────────────────────┤
│  Student Name    │ Score  │ Feedback          │
│─────────────────┼────────┼──────────────────│
│  Ahmad           │ [85]   │ [Good work]       │
│  Budi            │ [90]   │ [Excellent]       │
│  Citra           │ [  ]   │ [  ]              │
│  ...             │        │                   │
├──────────────────────────────────────────────┤
│                          [💾 Save All Grades] │
└──────────────────────────────────────────────┘
```

### Technical Details
- Use local state array `tableRows` with `{student_id, score, feedback}` per student
- On "Save All": filter rows where score is non-empty, bulk insert via `supabase.from("manual_grades").upsert(...)` or insert multiple
- No database changes needed — uses existing `manual_grades` table
- Tabs component from shadcn for mode switching

### Files
| File | Change |
|------|--------|
| `src/pages/AdminManualGrades.tsx` | Add Tabs with Card View + Table Entry mode with editable spreadsheet table |

