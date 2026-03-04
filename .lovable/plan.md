

## Phase 4: Student Portal

### New Files

**`src/components/student/StudentLayout.tsx`** — Shared layout mirroring AdminLayout:
- Header with "Student Portal" branding, user email, sign out
- Bottom nav with 4 items: Home, Materials, Quizzes, Grades
- Icons: Home, FileText, ClipboardList, Star

**`src/pages/StudentDashboard.tsx`** — Full rewrite:
- Wrapped in StudentLayout
- **Announcements section**: Fetch from `announcements` table, show latest 3 in pastel cards with date
- **Pending Quizzes**: Fetch active quizzes where student has no submission yet, show as "To-Do" cards with link to take quiz
- **Progress section**: Fetch `quiz_submissions` for current user, compute average score, show with a Progress bar + emoji badges (e.g. 🌟 for 90%+, 🌸 for 70%+)

**`src/pages/StudentMaterials.tsx`** — New page:
- Fetch from `materials` table
- Card grid with type badge (worksheet/tutorial), title, description
- Download/view button linking to `file_url`

**`src/pages/StudentQuiz.tsx`** — New page (`/student/quiz/:id`):
- Fetch quiz + questions from `quiz_questions` ordered by `order_index`
- For each question:
  - If `media_url` exists: render `<img>` for image URLs or `<audio controls>` for audio URLs
  - If `multiple_choice`: render radio buttons for each option
  - If `text_input`: render a textarea
- State management: track answers in local state
- "Submit Quiz" button: inserts into `quiz_submissions` + `submission_answers`, then redirects to grades
- Prevent re-submission if already submitted

**`src/pages/StudentGrades.tsx`** — New page:
- Fetch `quiz_submissions` joined with quiz title for current user
- Card list showing: quiz title, score (or "Pending"), status badge (pastel green/yellow), date
- Expandable section showing teacher feedback text
- Overall average score at top with decorative progress bar

### Modified Files

**`src/App.tsx`** — Add 3 new protected student routes:
- `/student/materials` → StudentMaterials
- `/student/quiz/:id` → StudentQuiz  
- `/student/grades` → StudentGrades

### No Database Changes Needed
All tables and RLS policies already exist from Phase 3. Students can SELECT announcements, materials, active quiz questions, and their own submissions. Students can INSERT submissions and answers.

### UI Theme
All pages use the existing pastel design system: glass cards, rounded-2xl corners, blush/lavender accent colors, Nunito/Quicksand fonts, mobile-first layout with bottom nav.

