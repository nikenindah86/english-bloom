

## Plan: Excel-like Spreadsheet Grading

### Problem
Current table entry only allows one exam title at a time. Need a full spreadsheet view with multiple exam columns side-by-side, like Excel.

### Approach

**New table: `grade_categories`** — defines the exam type columns per class (e.g., "Ulangan Harian 1", "UTS", "UAS")
- `id`, `class_id`, `name`, `max_score`, `order_index`, `created_at`
- Teachers CRUD these columns; they map to the `title` field in `manual_grades`

**Redesigned Table Entry in `AdminManualGrades.tsx`**:

```text
Class: [10A ▼]

         | Ulangan Harian 1 | UTS  | UAS  | ∑ Total | Avg  |
         | (max: 100)       | (100)| (100)|         |      |
─────────┼──────────────────┼──────┼──────┼─────────┼──────┤
Ali      |  85              |  90  |  78  |  253    | 84.3 |
Budi     |  70              |  —   |  92  |  162    | 81.0 |
Citra    |  95              |  88  |  —   |  183    | 91.5 |
─────────┼──────────────────┼──────┼──────┼─────────┼──────┤
Avg      |  83.3            | 89.0 | 85.0 |         |      |
         [+ Add Column]                    [💾 Save]
```

**Features**:
- **CRUD columns**: "Add Column" button opens a small form (name + max score). Edit/delete column via header context menu.
- **Auto-calculations**: 
  - Row: Total (sum), Average per student
  - Column: Average per exam type (footer row)
- **Inline editing**: Click cell to edit score, Tab to move to next cell
- **Auto-save indicator**: Save button saves all changed cells at once (upsert into `manual_grades` matching student_id + class_id + title)
- **Horizontal scroll** for many columns on mobile

### Database

**New table: `grade_categories`**
```sql
- id (uuid PK)
- class_id (uuid, NOT NULL)
- name (text) — e.g. "Ulangan Harian 1"
- max_score (numeric, default 100)
- order_index (integer, default 0)
- created_at (timestamptz)
```
RLS: Teachers full access, students can view categories for their class.

**No changes to `manual_grades`** — the existing `title` field maps to category name.

### Files

| File | Change |
|------|--------|
| Migration | Create `grade_categories` table with RLS |
| `src/pages/AdminManualGrades.tsx` | Replace simple table with Excel-like spreadsheet view |

### Auto-calculation Details
- **Sum**: Add all scores in a row (skip empty cells)
- **Average**: Sum / number of filled cells in that row
- **Column Average**: Average of all filled scores in that column (footer)
- All calculated in real-time on the client, not stored in DB

