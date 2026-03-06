

## Plan: Improve AI Reading Passage Generation with Curriculum Context

### Problem
The AI currently generates passages like "what is narrative text" (a definition/explanation about the genre) instead of generating an actual narrative text (e.g., a fable, myth, folktale). Same issue for procedure text — it explains what procedure text is instead of generating actual step-by-step instructions.

### Root Cause
The passage generation prompt in `generate-assessment/index.ts` is generic: `"Generate a reading passage about ${topic}"`. It needs curriculum-aware context so the AI generates **content in the genre** rather than **about the genre**.

### Solution
Update the edge function's passage generation prompt to include genre-aware instructions. Add a mapping of text types to specific generation instructions so the AI produces authentic texts (e.g., a fable for Narrative, a recipe for Procedure).

Also pass the `question_type` context from the frontend so the prompt can be tailored further.

### Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-assessment/index.ts` | Rewrite the passage prompt to detect genre keywords (Narrative, Procedure, Descriptive, Recount, Exposition, Discussion, Explanation, Review, News Item) from the `topic` field and generate **authentic content in that genre** instead of a definition. Add a genre map with specific instructions (e.g., Narrative → "Write a fable, myth, or folktale story with characters, setting, complication, and resolution"; Procedure → "Write step-by-step instructions for doing/making something, with a goal, materials list, and numbered steps"). |

### Prompt Logic (Edge Function)

```
Genre detected from topic → specific instruction:

- "narrative" → "Write a short story (fable, myth, legend, or folktale) with Orientation, Complication, and Resolution. Include characters, setting, and a moral lesson."
- "procedure" → "Write a procedure text with a clear Goal, list of Materials/Ingredients, and numbered Steps explaining how to do/make something."
- "descriptive" → "Write a descriptive text about a specific person, place, or thing with vivid details using Identification and Description structure."
- "recount" → "Write a recount of a past experience with Orientation, sequence of Events, and Re-orientation."
- "analytical exposition" → "Write an argumentative text with a Thesis, supporting Arguments, and Reiteration about a debatable topic."
- "hortatory exposition" → "Write a persuasive text with Thesis, Arguments, and Recommendation urging the reader to take action."
- "explanation" → "Write an explanation text describing a natural/social process with General Statement, step-by-step Explanation, and Conclusion."
- "discussion" → "Write a discussion text presenting two sides (pro and contra) of an issue with Issue, Arguments For, Arguments Against, and Conclusion."
- "review" → "Write a review of a book, film, or product with Identification, Evaluation, and Interpretation."
- "news item" → "Write a news article about an event with Headline-worthy opening, Newsworthy events, and Background information."
- (default) → current generic prompt
```

This is a single-file change to the edge function — no UI changes needed since the topic field already exists and gets passed to the function.

