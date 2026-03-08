

## Plan: Shuffle Multiple Choice Answer Positions

### Problem
AI-generated quiz questions consistently place the correct answer at the same position (e.g., always option A). This makes quizzes predictable.

### Solution
After the AI returns the questions, **shuffle each question's options array** while keeping `correct_answer` matched. This is done server-side in `supabase/functions/generate-quiz/index.ts`.

### Implementation

**File**: `supabase/functions/generate-quiz/index.ts`

1. Add a simple Fisher-Yates shuffle function
2. After parsing AI response (line ~117), for each multiple_choice question: shuffle the `options` array before returning
3. Since `correct_answer` is stored as a text value (not an index), it remains valid regardless of option order

Additionally, enhance the prompt (line ~109) to explicitly instruct the AI to vary correct answer positions — this provides a first layer of randomization, with the server-side shuffle as a guaranteed second layer.

### Prompt Change
Add to the prompt: `"IMPORTANT: Vary the position of the correct answer randomly across questions. Do not always place it as the first option."`

### Files

| File | Change |
|------|--------|
| `supabase/functions/generate-quiz/index.ts` | Add shuffle function + shuffle options per question + update prompt |

No database changes needed.

