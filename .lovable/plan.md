

## Plan: View Quiz, Duplicate Quiz, and Recreate (AI) Features

### 1. View Quiz Dialog (Read-only)

**File**: `src/pages/AdminQuizzes.tsx`

Add a read-only "View Quiz" dialog that shows quiz details and all questions without editing capability:
- New state: `viewQuiz` (quiz object or null), `viewQuestions` (questions array)
- New `Eye` icon button in quiz row actions (before Edit)
- Dialog shows: title, description, class, status, settings, scheduling info, and all questions with their options/answers in a clean read-only format

### 2. Duplicate Quiz

**File**: `src/pages/AdminQuizzes.tsx`

Add a `Copy` icon button in quiz row actions:
- `handleDuplicate(quiz)`: fetches the quiz's questions, inserts a new quiz with title "(Copy) Original Title", `is_active: false`, same settings, then inserts cloned questions
- After duplicate, refreshes quiz list and shows toast

### 3. Recreate Quiz (AI-powered)

**File**: `src/pages/AdminQuizzes.tsx`

After a quiz is duplicated (or on any existing quiz), add a "Recreate with AI" button:
- New `Sparkles` icon button in quiz row actions (or inside view dialog)
- `handleRecreate(quiz)`: fetches quiz questions to determine topic (from title + description), question count, and question type, then calls the existing `generate-quiz` edge function with those same parameters
- The generated questions replace the duplicated quiz's questions (via delete + insert)
- This gives teachers a fresh set of questions on the same topic instantly
- Show a confirmation dialog before recreating: "This will replace all questions with new AI-generated ones on the same topic. Continue?"

### Action Buttons Order (per quiz row)

```text
[Switch] [Eye/View] [Copy/Duplicate] [Sparkles/Recreate] [Edit] [Delete]
```

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminQuizzes.tsx` | Add View dialog, Duplicate handler, Recreate (AI) handler with confirmation, new icon buttons |

