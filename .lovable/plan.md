

## Problem

Currently the Grading page shows a flat list of all quiz submissions across all classes. With 100+ students across multiple classes, each taking multiple quizzes/assessments, this becomes an unmanageable wall of items. There's no way to filter by class or group by quiz/assessment.

Additionally, the page only shows **quiz** submissions -- it ignores **assessment** submissions entirely, which should also be gradable here.

## Plan: Restructured Grading Page with Class & Quiz/Assessment Grouping

### New UI Structure

```text
[Class Filter Dropdown: "All Classes" | "Class X" | "Class Y"]
[Source Tabs: All | Quizzes | Assessments]
[Status Tabs: All | Pending | Graded]

▼ Jumbled Sentences (Quiz) — 3 pending, 5 graded
   ├─ Angelina Intan Elvina  [graded] Score: 943
   ├─ Student B              [pending]
   └─ Student C              [graded] Score: 85

▼ Midterm Assessment — 2 pending
   ├─ Student A              [pending]
   └─ Student D              [pending]
```

### Changes in `src/pages/AdminGrading.tsx`

1. **Fetch classes** for the filter dropdown (from `classes` table)
2. **Fetch assessment submissions** alongside quiz submissions -- merge into a unified submission type with a `source` field ("quiz" | "assessment")
3. **Add class filter state** (`selectedClassId`) -- filter quizzes/assessments by `class_id`
4. **Add source filter tabs** (All / Quizzes / Assessments)
5. **Group submissions by quiz/assessment title** using collapsible accordion sections, each showing:
   - Title + type badge (Quiz/Assessment)
   - Summary counts (X pending, Y graded)
   - Expandable list of student submissions inside
6. **Keep existing expand/grade functionality** for individual submissions within each group
7. **Assessment answer details**: when expanding an assessment submission, fetch from `assessment_answers` + `assessment_questions` instead of quiz tables

### Data Flow

- Fetch quiz submissions → join with `quizzes.class_id` and `quizzes.title`
- Fetch assessment submissions → join with `assessments.class_id` and `assessments.title`
- Merge into unified list with `source` discriminator
- Group by `quiz_id` or `assessment_id`
- Filter by selected class and source type

### File Changed

| File | Change |
|------|--------|
| `src/pages/AdminGrading.tsx` | Complete restructure: add class filter, source tabs, group-by-quiz/assessment accordion, include assessment submissions |

