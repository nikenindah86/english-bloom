

## Plan: Delete Students (Single + Bulk)

### Problem
Deleting a student requires removing them from `auth.users` (which needs the service role key — not available client-side). So we need a backend function.

### 1. Create Edge Function `delete-students`

**`supabase/functions/delete-students/index.ts`**
- Accepts `{ student_ids: string[] }` in POST body
- Verifies caller is a teacher using `has_role` check
- For each student ID: deletes from `auth.admin.deleteUser(id)` using service role
- The `handle_new_user` trigger created profiles/user_roles with `ON DELETE CASCADE` references, but since profiles.id has no FK to auth.users, we must manually delete from `profiles`, `user_roles`, and related tables (attendance, submissions, etc.) before or after deleting the auth user
- Actually, checking the schema: profiles.id has no FK constraint to auth.users, and user_roles.user_id also has no FK. So we need to manually clean up:
  - Delete from `user_roles` where `user_id` in IDs
  - Delete from `profiles` where `id` in IDs
  - Delete from `attendance`, `quiz_submissions`, `submission_answers`, `assessment_submissions`, `assessment_answers`, `assignment_submissions`, `lesson_completions`, `student_notes`, `notifications`, `stream_comments` where `student_id`/`user_id` in IDs
  - Delete auth user via `supabase.auth.admin.deleteUser()`

### 2. Update `AdminStudents.tsx`

- Add `selectedIds: Set<string>` state for bulk selection
- Add checkbox on each student row + "select all" checkbox in header
- Add Trash icon button per row for single delete
- When selections exist, show a red "Delete Selected (N)" button in the toolbar
- Both single and bulk delete show an AlertDialog confirmation before proceeding
- On confirm, call the `delete-students` edge function with the IDs
- Clear selection and invalidate query on success

### UI Changes

- Each student card gets a `Checkbox` on the left side
- A "select all on page" checkbox appears above the list
- Bulk action bar appears when items are selected: "N selected — Delete Selected"
- Single delete: Trash icon button next to Edit button
- Confirmation dialog with student name(s) listed

### Files

| File | Change |
|------|--------|
| `supabase/functions/delete-students/index.ts` | New edge function |
| `src/pages/AdminStudents.tsx` | Add selection state, checkboxes, delete buttons, confirmation dialog, delete mutation |

