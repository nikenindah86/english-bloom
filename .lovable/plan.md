

## Plan: Fix Topic Input + Add Search/Pagination/Filter to Student Pages

### 1. Fix AI Quiz Generator Topic Input

**File**: `src/components/admin/AiQuizGenerator.tsx`

The topic field uses `<Input>` (single line). Change to `<Textarea>` with `rows={2}` and allow it to expand, so teachers can enter longer topics/subjects.

### 2. Add Search, Pagination, and Sort/Filter to Student Pages

Apply a consistent pattern across all student listing pages: a search bar, sort dropdown, and pagination controls (e.g., 10 items per page).

**Pages to update:**

| Page | Search by | Sort options | Filter options |
|------|-----------|-------------|----------------|
| `StudentQuizzes.tsx` | Title, description | Date (newest/oldest), Status (done/pending) | Status: All / Done / Pending / Expired |
| `StudentAssignments.tsx` | Title, description | Due date, Status | Status: All / Submitted / Pending / Expired |
| `StudentMaterials.tsx` | Title, description | Date (newest/oldest), Type | Type filter (from material types) |
| `StudentAssessments.tsx` | Title, description | Date, Status | Status: All / Submitted / Not Started / Expired |
| `StudentCourses.tsx` | Title, description | Progress, Title | Status: All / Completed / In Progress |

**Pattern per page:**
- Search `<Input>` with search icon at top
- Sort `<Select>` dropdown (newest first default)
- Filter `<Select>` for status/type
- Client-side pagination: 10 items per page, Previous/Next buttons with page indicator
- All filtering/sorting is client-side since data volumes are small

### Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AiQuizGenerator.tsx` | Change topic `Input` → `Textarea` |
| `src/pages/StudentQuizzes.tsx` | Add search, sort, filter, pagination |
| `src/pages/StudentAssignments.tsx` | Add search, sort, filter, pagination |
| `src/pages/StudentMaterials.tsx` | Add search, sort, filter, pagination |
| `src/pages/StudentAssessments.tsx` | Add search, sort, filter, pagination |
| `src/pages/StudentCourses.tsx` | Add search, sort, filter, pagination |

