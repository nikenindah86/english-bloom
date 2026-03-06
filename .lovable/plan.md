

## Plan: Thumbnail Upload, API Key Migration, and Scheduling/Expiry

### 1. Product Thumbnail — File Upload Support

**Current**: Only URL input for thumbnail.
**Change**: Add file upload option alongside URL input in `AdminProducts.tsx`.

- Add a file input (`<input type="file" accept="image/*">`) next to the URL input
- On file select, upload to `materials` bucket (already public), get public URL, set as `thumbnail_url`
- Show a preview of the current thumbnail (URL or uploaded)
- Keep the URL input as fallback for external links

**File**: `src/pages/AdminProducts.tsx`

### 2. API Keys — Already in Cloud Database

After reviewing the code, **API keys are already stored in the database** (`gemini_api_keys` table), not locally. The edge functions (`generate-quiz`, `generate-assessment`) fetch keys from this table at runtime. The `ApiKeyManager` component reads/writes to the database via Supabase client.

**No migration needed.** The API keys are already stored securely in the cloud database with RLS policies restricting access to teachers only. Will inform user of this.

### 3. Scheduling & Expiry for Quizzes, Assessments, and Assignments

**Database Migration** — Add scheduling columns:

| Table | New Columns |
|-------|------------|
| `quizzes` | `scheduled_at` (timestamptz nullable), `expires_at` (timestamptz nullable) |
| `assessments` | `scheduled_at` (timestamptz nullable), `expires_at` (timestamptz nullable) |
| `assignments` | `scheduled_at` (timestamptz nullable), `expires_at` (timestamptz nullable) |

Note: `assignments` already has `due_date` — we'll add `scheduled_at` for publish scheduling and rename/repurpose `due_date` as the soft deadline while `expires_at` is the hard cutoff.

**Admin Side Changes:**

| File | Change |
|------|--------|
| `AdminQuizzes.tsx` | Add "Scheduled At" and "Expires At" datetime inputs in quiz dialog. Display scheduling badges on quiz list. |
| `AdminAssessments.tsx` | Add "Scheduled At" and "Expires At" datetime inputs in assessment dialog. |
| `CreateAssignmentDialog.tsx` | Add "Scheduled At" and "Expires At" datetime inputs. |

**Student Side Changes:**

| File | Change |
|------|--------|
| `StudentQuizzes.tsx` | Filter out quizzes where `now() < scheduled_at`. Show "Expired" badge and disable access if `now() > expires_at`. |
| `StudentQuiz.tsx` | Check expiry before allowing quiz start. Show error if expired. |
| `StudentAssessments.tsx` | Same — filter by schedule, block if expired. |
| `StudentAssessment.tsx` | Check expiry before starting. |
| `StudentAssignments.tsx` | Show "Expired" state and disable submission if past `expires_at`. |

**Logic**: 
- If `scheduled_at` is set and `now() < scheduled_at` → hide or show "Upcoming" badge, disable access
- If `expires_at` is set and `now() > expires_at` → show "Expired" badge, disable submission/start
- Both fields are optional (null = no restriction)

### Files Summary

| File | Action |
|------|--------|
| DB Migration | Add `scheduled_at`, `expires_at` to quizzes, assessments, assignments |
| `src/pages/AdminProducts.tsx` | Add file upload for thumbnail |
| `src/pages/AdminQuizzes.tsx` | Add schedule/expiry inputs |
| `src/pages/AdminAssessments.tsx` | Add schedule/expiry inputs |
| `src/components/admin/CreateAssignmentDialog.tsx` | Add schedule/expiry inputs |
| `src/pages/StudentQuizzes.tsx` | Schedule/expiry filtering & UI |
| `src/pages/StudentQuiz.tsx` | Expiry check before start |
| `src/pages/StudentAssessments.tsx` | Schedule/expiry filtering & UI |
| `src/pages/StudentAssessment.tsx` | Expiry check before start |
| `src/pages/StudentAssignments.tsx` | Expiry check, disable submission |

