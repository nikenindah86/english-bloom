

## Plan: Student Profile Detail View for Admin + Photo Upload

### Problem
1. Admin Students page (`/admin/students`) only shows name and join date. Clicking edit only allows changing the name. There's no way for teachers to see the full biodata (class, DOB, address, phone, parent, gender, etc.).
2. Student profile form has no photo/avatar upload capability.

### Changes

#### 1. Admin Student Detail Dialog
**File: `src/pages/AdminStudents.tsx`**
- Expand the student query to fetch ALL profile fields (class_id, place_of_birth, date_of_birth, gender, address, phone, parent_name, avatar_url)
- Join with `classes` to get class_name for display
- Replace the simple edit dialog with a detail/view dialog showing all biodata in a clean read-only card layout
- Keep the edit name functionality but also show all other fields as read-only info
- Show avatar photo if available (or letter fallback)

#### 2. Photo Upload in Student Profile
**Database migration**: Create `avatars` storage bucket (public) with RLS for users to upload their own avatar.

**File: `src/pages/StudentProfile.tsx`**
- Add avatar upload section at the top of the form (circular photo area with camera/upload icon)
- On file select: upload to `avatars/{user.id}` in storage, get public URL, save to `profiles.avatar_url`
- Show current avatar or letter fallback
- Load `avatar_url` from profile on mount

### Files

| File | Change |
|------|--------|
| Migration | Create `avatars` storage bucket + RLS policies |
| `src/pages/AdminStudents.tsx` | Fetch full profile, show detail dialog with all biodata |
| `src/pages/StudentProfile.tsx` | Add avatar upload with preview |

