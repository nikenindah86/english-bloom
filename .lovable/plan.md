

## Plan: Assessment / Test Menu (AI-Powered, Using User's Gemini API Keys)

### Overview

A formal "Assessments" module separate from the gamified Quizzes. Teachers build structured tests with sections (MC, True/False, Essay, etc.), configure difficulty/cognitive levels, and use AI to generate questions via their existing Gemini API keys (same key rotation + model fallback as the quiz generator). Students see active assessments and take them with a question navigator + timer.

### How It Works (Flow)

**Admin (Teacher) Side:**

1. **Open Assessments page** → sees list of assessments as cards (title, class, sections, question count, status)
2. **Create Assessment** → Step-by-step dialog:
   - **Step 1 — Basic Info**: Title, Class, Duration (minutes), Description
   - **Step 2 — Add Sections**: For each section:
     - Question type (Multiple Choice / True-False / Short Answer / Essay)
     - Number of questions for this section
     - Reading passage toggle + textarea (optional — for reading comprehension)
     - Difficulty mix: Easy / Medium / Hard counters
     - Cognitive level: C1-C6 toggle buttons (Bloom's taxonomy)
     - "Add Section" button → appends to structure list
   - **Step 3 — Structure Overview**: 
     - Shows all sections with summary (e.g. "Part 1: MC, 10 questions, Easy-Medium, C2-C4")
     - **"AI Generate Questions"** button per section → calls `generate-assessment` edge function using user's Gemini API keys
     - Manual add/edit/delete individual questions
     - Total question count
3. **Activate/Deactivate** assessment via toggle (only active ones visible to students)
4. **View Results** → see student submissions and scores

**Student Side:**

1. **Assessments list page** → cards showing title, duration, question count, status (Not Started / Completed)
2. **Take Assessment** → 
   - Start screen with title, description, duration, question count
   - Test UI: question display + answer input + **question navigator grid** (numbered buttons to jump)
   - Timer countdown in header
   - Reading passage panel (split-screen) when section has a passage
   - Submit button with confirmation dialog
   - Results screen showing score

### UI Mockup

```text
── Admin: Assessment Builder ──────────────
Step 2: Add Sections

Question Type: [Multiple Choice ▼]
Number of Questions: [10]
☐ Include Reading Passage
   [Reading passage text area...]

Difficulty:  Easy [3]  Medium [5]  Hard [2]
Cognitive:   ○C1 ●C2 ●C3 ●C4 ○C5 ○C6

[+ Add Section]

── Step 3: Structure Overview ─────────────
Part 1: Multiple Choice — 10 questions (E:3 M:5 H:2)
  [✨ AI Generate] [✏️ Edit] [🗑️]
Part 2: True/False — 5 questions (E:2 M:3)
  [✨ AI Generate] [✏️ Edit] [🗑️]
Part 3: Essay — 2 questions
  [✨ AI Generate] [✏️ Edit] [🗑️]

Total: 17 questions  |  Duration: 60 min
[Save as Draft]  [Save & Activate]
```

```text
── Student: Taking Assessment ─────────────
┌─────────────────────────────────┐
│ English Mid-Term    ⏱ 45:32    │
├─────────────────────────────────┤
│                                 │
│ Reading Passage    │ Question 3 │
│ (if applicable)    │ of 17      │
│                    │            │
│ "The quick brown   │ What does  │
│  fox jumped..."    │ the author │
│                    │ imply...?  │
│                    │            │
│                    │ ○ A        │
│                    │ ○ B        │
│                    │ ○ C        │
│                    │ ○ D        │
│                    │            │
├─────────────────────────────────┤
│ Navigator:                      │
│ [1][2][3●][4][5]...[17]        │
│              [Submit Test]      │
└─────────────────────────────────┘
```

### Database (5 new tables)

**`assessments`**: `id`, `class_id`, `title`, `description`, `duration_minutes`, `is_active` (default false), `created_at`

**`assessment_sections`**: `id`, `assessment_id` (FK), `title`, `question_type` (text: multiple_choice/true_false/short_answer/essay), `num_questions`, `reading_passage` (text, nullable), `difficulty_easy`/`difficulty_medium`/`difficulty_hard` (int defaults 0), `cognitive_levels` (jsonb — array of "C1"-"C6"), `order_index`

**`assessment_questions`**: `id`, `section_id` (FK), `assessment_id` (FK), `question_text`, `options` (jsonb, nullable), `correct_answer` (text, nullable), `difficulty` (text), `cognitive_level` (text), `order_index`

**`assessment_submissions`**: `id`, `assessment_id`, `student_id`, `started_at`, `submitted_at`, `score` (numeric, nullable), `status` (text: in_progress/submitted/graded)

**`assessment_answers`**: `id`, `submission_id`, `question_id`, `answer_text`, `is_correct` (bool, nullable), `points` (numeric, default 0)

RLS: Teachers full CRUD. Students can view active assessments for their class, CRUD own submissions/answers.

### Edge Function: `generate-assessment`

Reuses the **same pattern as `generate-quiz`**: fetches active keys from `gemini_api_keys` table, tries each key × each Gemini model with fallback. Accepts section config (question type, difficulty distribution, cognitive levels, reading passage, num questions). Returns structured questions.

### Files

| File | Change |
|------|--------|
| Migration | Create 5 tables with RLS |
| `supabase/functions/generate-assessment/index.ts` | New edge function (user's Gemini keys) |
| `src/pages/AdminAssessments.tsx` | New — multi-step assessment builder |
| `src/pages/StudentAssessments.tsx` | New — list of available assessments |
| `src/pages/StudentAssessment.tsx` | New — test-taking UI with navigator + timer |
| `src/App.tsx` | Add 3 routes |
| `src/components/admin/AdminLayout.tsx` | Add "Assessments" sidebar item |
| `src/components/student/StudentLayout.tsx` | Add "Tests" nav item |
| `src/pages/AdminDashboard.tsx` | Add to mobile grid |
| `src/pages/StudentDashboard.tsx` | Show pending assessments |

