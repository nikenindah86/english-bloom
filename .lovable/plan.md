

## Plan: Admin Grade Overview Table (Excel-style Helicopter View)

### Concept

A new page "Grade Overview" that displays a comprehensive Excel-like table per class. Columns represent each grading component (individual quizzes, assessments, manual grade categories, attendance rate) plus the weighted total and passing grade status. Rows are students.

### UI Layout

```text
[Class Filter Dropdown]

┌──────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────┬────────┬────────┐
│ Student Name     │ Quiz 1   │ Quiz 2   │ Assess 1 │ UTS      │ UAS      │ Att.% │ Total  │ Status │
├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────┼────────┼────────┤
│ Angelina Intan   │ 85       │ 90       │ 78       │ 80       │ 85       │ 95%   │ 84.2   │ ✅ Pass│
│ Student B        │ 60       │ 70       │ 55       │ 65       │ 70       │ 80%   │ 65.1   │ ❌ Fail│
├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼───────┼────────┼────────┤
│ AVERAGES         │ Quiz Avg │ Quiz Avg │ Ass Avg  │ Man Avg  │ Man Avg  │ Att%  │ W.Total│        │
│ WEIGHTS          │     ← quiz_weight% →          │← assess%→│← manual%→│ att%  │  100%  │        │
└──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────┴────────┴────────┘
```

### Data Fetched Per Class

1. **Students** — profiles with `class_id`
2. **Grading config** — weights + passing grade threshold
3. **Quizzes** — all quizzes for the class → their graded `quiz_submissions` per student
4. **Assessments** — all assessments for the class → their graded `assessment_submissions` per student
5. **Manual grade categories** — `grade_categories` for the class → `manual_grades` per student per category
6. **Attendance** — all `attendance` records per student → calculate present rate

### Calculation (per student)

- **Quiz Avg** = average of all graded quiz scores (or "—" if none)
- **Assessment Avg** = average of all graded assessment scores
- **Manual Avg** = average of (score/max_score × 100) across all categories
- **Attendance Rate** = (present count / total records) × 100
- **Weighted Total** = (QuizAvg × quiz_weight + AssessAvg × assessment_weight + ManualAvg × manual_weight + AttRate × attendance_weight) / 100
- **Status** = Total ≥ passing_grade → Pass, else Fail

### Table Features

- Horizontally scrollable for many columns
- Color-coded total cell (green ≥ pass, red < pass)
- Summary row at bottom with class averages
- Weight labels shown in a sub-header row
- Individual quiz/assessment scores shown as separate columns for granularity

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/pages/AdminGradeOverview.tsx` | **New page** — full Excel-style table with all the above |
| `src/App.tsx` | Add route `/admin/grade-overview` |
| `src/components/admin/AdminLayout.tsx` | Add "Grade Overview" nav link in assessment group |

No database changes needed — all data already exists in current tables.

