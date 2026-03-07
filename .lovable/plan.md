

## Plan: Passing Grade System with Weighted Components

### Concept

A configurable grading system where the teacher sets:
- **Component weights**: Quiz (%), Assessment (%), Manual Grades (%), Attendance (%) — must total 100%
- **Passing grade threshold**: e.g. 75/100
- **Per class**: each class can have its own configuration

Students see an animated score card on their dashboard showing their weighted total vs the passing grade.

### Score Calculation Logic

```text
Final Score = (Quiz Avg × quiz_weight) + (Assessment Avg × assessment_weight) 
            + (Manual Grade Avg × manual_weight) + (Attendance Rate × attendance_weight)

Where:
- Quiz Avg = average of graded quiz_submissions scores (0-100)
- Assessment Avg = average of assessment_submissions scores (normalized to 0-100)
- Manual Grade Avg = average of (score/max_score × 100) from manual_grades
- Attendance Rate = (present days / total attendance records) × 100
```

### Database Changes

**New table: `grading_config`**

| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| class_id | uuid (unique) | required |
| passing_grade | numeric | 75 |
| quiz_weight | numeric | 25 |
| assessment_weight | numeric | 25 |
| manual_weight | numeric | 25 |
| attendance_weight | numeric | 25 |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: Teachers full CRUD, students can SELECT for their own class.

### Files to Create/Modify

| File | Change |
|------|--------|
| **Migration** | Create `grading_config` table with RLS |
| `src/pages/AdminGradingConfig.tsx` | **New page** — Teacher CRUD for passing grade config per class: set weights (4 sliders/inputs that must sum to 100%), set passing grade threshold |
| `src/App.tsx` | Add route `/admin/grading-config` |
| `src/components/admin/AdminLayout.tsx` | Add nav link for "Passing Grade" |
| `src/pages/StudentDashboard.tsx` | Add animated "My Score" card: circular progress ring showing weighted total, color-coded (green if passing, amber if close, red if far), text showing "X points to pass" or "Above by X points!" with confetti/sparkle animation when passing |
| `src/pages/StudentGrades.tsx` | Add weighted total summary at top using same calculation |

### Admin UI (AdminGradingConfig)

- Select class dropdown
- Passing grade input (0-100)
- Four weight inputs with live validation (must sum to 100%)
- Save button → upsert to `grading_config`
- Visual preview of current weights as a simple bar/pie

### Student Dashboard Animation

- Circular progress ring (SVG) with animated stroke
- Center shows the score number with count-up animation
- Below: passing grade line indicator
- Status text: "🎉 Above passing grade by 12 points!" (green) or "📈 Need 8 more points to pass!" (amber/red)
- If no config set for class, show the existing simple progress card instead

