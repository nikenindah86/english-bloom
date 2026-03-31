

## Plan: Fix Duplicate-Looking Menu Items

### Problem
"Assessments" and "Assignments" are two distinct features but both use the `FileCheck` icon, making them appear duplicated in the sidebar and mobile nav.

### Fix
Change the icon for **Assignments** from `FileCheck` to `ClipboardEdit` (or `FileEdit` / `PenSquare`) to visually distinguish it from Assessments.

### Files to Change

| File | Change |
|------|--------|
| `src/components/admin/AdminLayout.tsx` | Change Assignments icon from `FileCheck` to `ClipboardPenLine` or similar |
| `src/components/MobileBottomNav.tsx` | Same icon change for Assignments in `adminMoreItems` |

