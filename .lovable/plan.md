

## Plan: AI Quiz Generation with Multiple API Keys & Auto-Fallback

### Concept
Add an "AI Generate" button in the quiz creation dialog. Teachers can manage multiple Google Gemini API keys. The system tries all text models on one key, then falls through to the next key if rate-limited.

### Database Migration

**New table: `gemini_api_keys`**
```
- id (uuid, PK)
- api_key (text, encrypted display but stored as text)
- label (text) — user-friendly name e.g. "Key 1"
- is_active (boolean, default true)
- created_at (timestamptz)
- created_by (uuid, FK → auth.users)
```

RLS: Only admin role can CRUD.

### Edge Function: `generate-quiz`

**Input**: `{ topic, num_questions, question_type, language }`

**Logic**:
1. Fetch all active API keys from `gemini_api_keys` ordered by created_at
2. Define model fallback order: `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.5-pro` → `gemini-2.0-flash` → `gemini-2.0-flash-lite`
3. For each key, try each model. If 429/exhausted, move to next model. If all models fail on that key, move to next key.
4. Prompt the model to return structured JSON with questions, options, and correct answers
5. Return generated questions array

### UI Changes

**`src/pages/AdminQuizzes.tsx`**:
1. Add **"AI Generate" button** (sparkle icon) in the quiz dialog, next to "Add Question"
2. Clicking opens a small form: Topic/Subject, Number of questions (5-20), Question type (MCQ/Text), Language
3. On generate: calls edge function, populates the `questions` state array with AI-generated questions
4. Teacher can review/edit before saving

**New Settings Section** (in AdminQuizzes or a dialog):
1. **"Manage API Keys"** button opens a dialog
2. List existing keys (masked display), add new key (label + key input), toggle active, delete
3. Stored in `gemini_api_keys` table

### Model Fallback Chain

```text
Key 1 → gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.5-pro → gemini-2.0-flash
  ↓ (all exhausted)
Key 2 → gemini-2.5-flash → gemini-2.5-flash-lite → ...
  ↓ (all exhausted)
Key N → ...
  ↓ (all exhausted)
Error: "All API keys exhausted"
```

### Files

| File | Change |
|------|--------|
| Migration | Create `gemini_api_keys` table with RLS |
| `supabase/functions/generate-quiz/index.ts` | New edge function with multi-key multi-model fallback |
| `src/pages/AdminQuizzes.tsx` | Add AI Generate button, API key management dialog, generation form |

