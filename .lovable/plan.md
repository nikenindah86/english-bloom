

## Plan: Quizizz-style Gamified Quiz Experience

Transform the current basic quiz into an interactive, gamified experience inspired by Quizizz.

### Database Migration

Add columns to existing tables:

**`quizzes`** table:
- `time_limit` (integer, nullable) — seconds per question (null = no timer)
- `show_answers_after` (boolean, default true) — show correct answer after each question
- `shuffle_questions` (boolean, default false)
- `shuffle_options` (boolean, default false)
- `points_per_question` (integer, default 100)

**`submission_answers`** table:
- `is_correct` (boolean, nullable) — auto-graded for MCQ
- `time_taken_ms` (integer, nullable) — how long student took
- `points` (integer, default 0) — points earned (speed bonus)

### Student Quiz UI Overhaul (`StudentQuiz.tsx`)

Replace the "all questions on one page" layout with a Quizizz-style flow:

1. **Start Screen** — Quiz title, description, question count, timer info. Big "Start" button.
2. **One Question at a Time** — Full-screen question card with:
   - Progress bar (question X of Y)
   - Countdown timer (animated circular/bar)
   - Large colorful option buttons (A/B/C/D grid for MCQ, text input for open-ended)
   - Question number + total
3. **Answer Feedback Screen** (if `show_answers_after` enabled) — After each answer:
   - Green check / Red X animation
   - Show correct answer if wrong
   - Points earned with speed bonus display
   - Streak counter (consecutive correct answers)
4. **Results Screen** — After all questions:
   - Total score with animated counter
   - Accuracy percentage
   - Time taken
   - Per-question breakdown (correct/incorrect list)
   - "View Leaderboard" button

### Auto-Grading Logic

On submit of each answer (or on final submit):
- For MCQ: compare `answer_text` with `correct_answer` → set `is_correct`
- Calculate points: base points × speed multiplier (faster = more points)
- Auto-calculate total `score` on `quiz_submissions` as sum of points
- Status auto-set to `graded` for all-MCQ quizzes, `pending` if any text_input questions

### Admin Quiz Settings (`AdminQuizzes.tsx`)

Add to the quiz create/edit dialog:
- Timer per question toggle + seconds input
- Shuffle questions toggle
- Shuffle options toggle
- Show answers after each question toggle
- Points per question input

### Quiz Leaderboard

New component: `src/components/QuizLeaderboard.tsx`
- Shown after quiz completion on results screen
- Query all submissions for this quiz, rank by score (then by time)
- Show top students with avatar, name, score, rank medal (gold/silver/bronze)

### Student Quizzes List (`StudentQuizzes.tsx`)

Update the quiz card to show:
- Timer badge if time limit set
- Question count
- Points available

### Files Summary

| File | Change |
|------|--------|
| Migration | Add 5 columns to `quizzes`, 3 columns to `submission_answers` |
| `src/pages/StudentQuiz.tsx` | Complete rewrite: start screen → one-at-a-time → feedback → results |
| `src/pages/AdminQuizzes.tsx` | Add timer/shuffle/points settings in create/edit dialog |
| `src/pages/StudentQuizzes.tsx` | Show timer/points badges on quiz cards |
| `src/components/QuizLeaderboard.tsx` | New: post-quiz leaderboard component |
| `src/pages/AdminGrading.tsx` | Show auto-graded status, skip manual grading for all-MCQ quizzes |

