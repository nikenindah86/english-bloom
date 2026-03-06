

## Plan: Link Assignments to Materials

### Concept
Create a junction table `assignment_materials` to connect assignments with materials. When creating an assignment, teachers can:
1. **Select existing materials** from the Materials library
2. **Add a new link/file** which auto-creates a material entry (so it also appears in the Materials menu)

This makes both menus interconnected — materials added from assignments show up in Materials, and existing materials can be attached to assignments.

### Database Migration

**New table: `assignment_materials`**
```
- id (uuid, PK)
- assignment_id (uuid, FK → assignments)
- material_id (uuid, FK → materials)
- created_at (timestamptz)
```

RLS: Teachers full access, students can view if they belong to the assignment's class.

### UI Changes

**`src/pages/AdminAssignments.tsx`** — New Assignment dialog additions:

1. **"Attach Materials" section** below max score:
   - Tabs: "Select Existing" | "Add New"
   - **Select Existing**: Multi-select list of materials (filtered by selected class), with checkboxes
   - **Add New**: Quick form — title, type (link/worksheet/tutorial), URL or file upload. On create, inserts into `materials` table first, then links via `assignment_materials`
2. **Assignment cards**: Show attached material count badge
3. **On create mutation**: After inserting assignment, insert `assignment_materials` rows for selected/new materials

**`src/pages/AdminMaterials.tsx`** — No changes needed (materials created from assignments auto-appear here)

**Student assignment view** (`StudentAssignments.tsx`): Show linked materials with download/open links

### Files

| File | Change |
|------|--------|
| Migration | Create `assignment_materials` table with RLS |
| `src/pages/AdminAssignments.tsx` | Add material attachment UI in create dialog, show material badges on cards |
| `src/pages/StudentAssignments.tsx` | Display linked materials for each assignment |

