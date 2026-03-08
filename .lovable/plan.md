

## Plan: Anti-Cheating System for Quizzes and Assessments

### Database Changes

Add `anti_cheat` boolean column (default `false`) to both tables:

```sql
ALTER TABLE quizzes ADD COLUMN anti_cheat boolean NOT NULL DEFAULT false;
ALTER TABLE assessments ADD COLUMN anti_cheat boolean NOT NULL DEFAULT false;
```

### New File: `src/hooks/useAntiCheat.ts`

A reusable hook that, when enabled, enforces:

1. **Fullscreen Lock** — On start, requests `document.documentElement.requestFullscreen()`. If student exits fullscreen, shows warning and re-requests. After 3 exits, auto-submits.
2. **Tab-Switch Detection** — Listens to `visibilitychange`. If `document.hidden`, increments violation count and shows warning toast. After 3 violations, calls `onAutoSubmit()` callback.
3. **Disable Copy-Paste & Right Click** — Adds event listeners for `copy`, `cut`, `paste`, `contextmenu` on `document`, calling `e.preventDefault()`.

Hook signature:
```ts
useAntiCheat({ enabled: boolean, onAutoSubmit: () => void })
// Returns: { violations: number, requestFullscreen: () => void }
```

Cleanup all listeners on unmount.

### Admin UI Changes

**`src/pages/AdminQuizzes.tsx`**:
- Add `antiCheat` state toggle
- Add Switch in the quiz config dialog (next to existing toggles like shuffle)
- Include `anti_cheat` in insert/update calls

**`src/pages/AdminAssessments.tsx`**:
- Add `antiCheat` state toggle  
- Add Switch in the assessment config dialog
- Include `anti_cheat` in insert/update calls

### Student UI Changes

**`src/pages/StudentQuiz.tsx`**:
- Import and call `useAntiCheat({ enabled: quiz?.anti_cheat, onAutoSubmit })` where `onAutoSubmit` triggers quiz submission with current answers
- On start screen, show warning badge if anti-cheat is enabled ("Mode Anti-Curang aktif")
- `requestFullscreen()` called inside `startQuiz()`

**`src/pages/StudentAssessment.tsx`**:
- Same integration — `useAntiCheat({ enabled: assessment?.anti_cheat, onAutoSubmit: handleSubmit })`
- Request fullscreen on `handleStart()`
- Show warning on start screen

### Files

| File | Change |
|------|--------|
| Migration | Add `anti_cheat` column to `quizzes` and `assessments` |
| `src/hooks/useAntiCheat.ts` | New hook — fullscreen, tab detection, disable copy/paste/right-click |
| `src/pages/AdminQuizzes.tsx` | Add anti-cheat toggle in quiz config |
| `src/pages/AdminAssessments.tsx` | Add anti-cheat toggle in assessment config |
| `src/pages/StudentQuiz.tsx` | Integrate `useAntiCheat` hook |
| `src/pages/StudentAssessment.tsx` | Integrate `useAntiCheat` hook |

