

## Phase 3: Quiz Management, Grading & Attendance

### 1. Database Migrations

**New table: `quiz_questions`**
- `id` uuid PK
- `quiz_id` uuid FK → quizzes.id ON DELETE CASCADE
- `question_text` text NOT NULL
- `question_type` text NOT NULL (values: `text_input`, `multiple_choice`)
- `media_url` text (nullable — for audio/image links)
- `options` jsonb (nullable — array of choice strings for multiple_choice)
- `correct_answer` text (nullable — correct answer for auto-reference)
- `order_index` integer NOT NULL DEFAULT 0
- `created_at` timestamptz DEFAULT now()

RLS: Teachers full CRUD, authenticated students SELECT on questions where quiz is active.

**New table: `submission_answers`**
- `id` uuid PK
- `submission_id` uuid FK → quiz_submissions.id ON DELETE CASCADE
- `question_id` uuid FK → quiz_questions.id
- `answer_text` text
- `created_at` timestamptz DEFAULT now()

RLS: Students INSERT/SELECT own (via submission.student_id), teachers SELECT all.

**New table: `attendance`**
- `id` uuid PK
- `student_id` uuid NOT NULL
- `date` date NOT NULL DEFAULT CURRENT_DATE
- `status` text NOT NULL (present/absent/late)
- `created_at` timestamptz DEFAULT now()
- UNIQUE(student_id, date)

RLS: Teachers full CRUD, students SELECT own.

**Enable realtime** on `quiz_submissions` for live grading updates.

### 2. Admin Layout Update

**`src/components/admin/AdminLayout.tsx`** — Add two nav items:
- "Grading" icon `CheckSquare` → `/admin/grading`
- "Attendance" icon `CalendarCheck` → `/admin/attendance`

Bottom nav will have 6 items total (smaller icons/text to fit mobile).

### 3. Quiz Management Page

**`src/pages/AdminQuizzes.tsx`** — Full rebuild:
- List all quizzes with title, question count, active status toggle
- "Create Quiz" button opens a full-page form/dialog
- Quiz form: title, description, is_active toggle
- Dynamic question builder: add/remove questions, each with:
  - Question text (textarea)
  - Type selector (text_input / multiple_choice)
  - Media URL input (optional, labeled "Audio/Image Link")
  - If multiple_choice: dynamic options list (add/remove), correct answer selector
- Save creates quiz + questions in a transaction
- Edit existing quiz loads questions for modification
- Delete quiz with confirmation

### 4. Grading Page

**`src/pages/AdminGrading.tsx`** — New page:
- Fetch all quiz_submissions joined with quiz title and student profile name
- Filter tabs: All / Pending / Graded
- Each submission card shows: student name, quiz title, date, status badge
- Click to expand: show student answers alongside questions
- Score input (number) + Feedback textarea + "Save Grade" button
- Updates submission status to "graded"

### 5. Attendance Page

**`src/pages/AdminAttendance.tsx`** — New page:
- Date picker at top (defaults to today)
- List all students (from profiles + user_roles where role=student)
- Each row: student name + 3 toggle buttons (Present / Absent / Late)
- Auto-saves on toggle change via upsert on (student_id, date)
- Visual indicators: green/red/yellow for status

### 6. Routing

**`src/App.tsx`** — Add two new protected routes:
- `/admin/grading` → AdminGrading
- `/admin/attendance` → AdminAttendance

### Files to create/modify:
- **Migration SQL** — quiz_questions, submission_answers, attendance tables + RLS
- `src/pages/AdminQuizzes.tsx` — rewrite
- `src/pages/AdminGrading.tsx` — new
- `src/pages/AdminAttendance.tsx` — new
- `src/components/admin/AdminLayout.tsx` — add nav items
- `src/App.tsx` — add routes

