

## Plan: Assignments, Comments, Calendar, Notifications, Archive, Student Notes

This is a large feature set (6 new features + migrations). Here's the full plan.

---

### Database Migration

New tables:

1. **`assignments`** — teacher-created tasks with deadlines
   - `id` (uuid PK), `class_id` (uuid NOT NULL), `title` (text), `description` (text), `due_date` (timestamptz), `max_score` (numeric, default 100), `created_at`
   - RLS: teacher full access, students can view assignments for their class

2. **`assignment_submissions`** — student file uploads for assignments
   - `id` (uuid PK), `assignment_id` (uuid NOT NULL), `student_id` (uuid NOT NULL), `file_url` (text), `note` (text), `score` (numeric), `feedback` (text), `status` (text, default 'submitted'), `submitted_at` (timestamptz, default now())
   - RLS: student can insert/view own, teacher full access

3. **`stream_comments`** — comments on announcements
   - `id` (uuid PK), `announcement_id` (uuid NOT NULL), `user_id` (uuid NOT NULL), `content` (text), `created_at`
   - RLS: authenticated can view, authenticated can insert own, teacher can delete any

4. **`class_schedules`** — recurring lesson schedule
   - `id` (uuid PK), `class_id` (uuid NOT NULL), `day_of_week` (int, 0-6), `start_time` (time), `end_time` (time), `subject` (text), `created_at`
   - RLS: teacher full access, students can view schedules for their class

5. **`notifications`** — per-user notifications
   - `id` (uuid PK), `user_id` (uuid NOT NULL), `class_id` (uuid), `title` (text), `message` (text), `type` (text), `is_read` (boolean, default false), `created_at`
   - RLS: user can view/update own notifications

6. **`student_notes`** — private teacher notes about students
   - `id` (uuid PK), `student_id` (uuid NOT NULL), `class_id` (uuid), `content` (text), `created_at`
   - RLS: teacher only (full CRUD)

Column additions:
- `classes` table: add `is_archived` (boolean, default false)

Storage:
- Create `assignments` bucket (public) for student file submissions

---

### New Pages & Components

| File | Description |
|------|-------------|
| `src/pages/AdminAssignments.tsx` | CRUD assignments per class: title, description, due date, max score. View submissions + grade them. |
| `src/pages/StudentAssignments.tsx` | View assignments for student's class, upload files, see grades/feedback. |
| `src/pages/AdminSchedule.tsx` | Manage weekly schedule per class: add/edit/delete time slots (day, start/end time, subject). |
| `src/pages/StudentSchedule.tsx` | View weekly schedule for student's class in a clean calendar/timetable format. |
| `src/pages/AdminStudentNotes.tsx` | Select student, write private notes. Only teacher can see. |
| `src/components/NotificationBell.tsx` | Bell icon in header with unread count badge, dropdown showing recent notifications. |
| `src/components/StreamComments.tsx` | Comment list + input below each announcement in class stream. |

---

### Modified Files

| File | Change |
|------|--------|
| `AdminLayout.tsx` | Add sidebar items: Assignments (Academic), Schedule (Academic), Student Notes (Assessment). |
| `StudentLayout.tsx` | Add nav items: Assignments, Schedule. Rearrange to fit 7 items → convert to sidebar like admin (or use "More" pattern). |
| `AdminClassDetail.tsx` | Add Assignments tab. Add comments to stream announcements. Add "Archive Class" button in settings. Filter out archived classes from lists. |
| `AdminClasses.tsx` | Add toggle to show/hide archived classes. Archived classes shown grayed out with "Unarchive" option. |
| `AdminDashboard.tsx` | Add notification bell to header. |
| `StudentDashboard.tsx` | Add notification bell to header. Show upcoming assignment deadlines. |
| `App.tsx` | Add routes: `/admin/assignments`, `/admin/schedule`, `/admin/student-notes`, `/student/assignments`, `/student/schedule` |

---

### Student Layout Redesign

With 7 nav items (Home, Materials, Quizzes, Assignments, Schedule, Grades, Profile), the bottom nav won't fit. Convert StudentLayout to use sidebar navigation like AdminLayout — consistent UX across both roles.

---

### Notification Logic

Notifications are created via database triggers or manually by teacher. For this iteration, notifications are created in-app when:
- Teacher posts announcement → notification to class students (done client-side when posting)
- Teacher grades assignment → notification to student
- Assignment deadline approaching (future iteration)

---

### Summary

- **6 new tables** + 1 column addition + 1 storage bucket
- **5 new pages** + 2 new components
- **7 modified files**
- Student layout converted to sidebar

