

## Plan: Assessment Improvements — Topic Field, New Question Types, AI-Generated Reading Passages

### Changes

**1. Add "Topic / Exam Material" field in Step 1**
Currently the AI uses the assessment `title` as the topic. Add a dedicated `topic` text input in Step 1 so teachers can specify the exact exam material/topic separately from the title.

- No DB change needed — pass `topic` as a local state field to the edge function (already accepts `topic` param)

**2. Add 2 new question types**
- `mcma` — **Multiple Choice Multiple Answer** (checkboxes, multiple correct answers). Options are an array, `correct_answer` stores multiple answers as JSON array string.
- `true_false_statement` — **Categorized True/False** (given a reading passage, students mark each statement as True or False — as shown in image-33). Each "question" is a statement with correct_answer "True" or "False", but displayed in a table format on the student side.

Update `QUESTION_TYPES` array in AdminAssessments and the edge function prompt handling.

**3. AI-generated reading passages**
When "Include Reading Passage" is checked, instead of requiring teachers to paste text manually, add a "Generate Passage with AI" button that calls the edge function to generate a relevant reading passage based on the topic. Teachers can still edit the result or paste their own.

Add a new param `generate_passage: true` to the edge function. When set, it generates a reading passage first, then generates questions based on it. Returns both `reading_passage` and `questions`.

### Files

| File | Change |
|------|--------|
| `src/pages/AdminAssessments.tsx` | Add topic field in Step 1, add MCMA + True/False Statement to QUESTION_TYPES, add "AI Generate Passage" button in reading passage section, pass topic to edge function |
| `supabase/functions/generate-assessment/index.ts` | Handle `mcma` and `true_false_statement` types in prompt, handle `generate_passage` flag to auto-generate reading passage |
| `src/pages/StudentAssessment.tsx` | Handle MCMA (checkbox) and True/False Statement (table) rendering |

### UI Detail

**Step 1** adds:
```
Topic / Exam Material *
[ Present Perfect Tense - Reading Comprehension ]
```

**Step 2** question type dropdown now shows:
- Multiple Choice
- Multiple Choice (Multiple Answer)
- True / False
- True / False (Statement Table)
- Short Answer
- Essay

**Reading Passage section** adds:
```
☑ Include Reading Passage
[✨ Generate Passage with AI]
[textarea with generated/pasted passage]
```

