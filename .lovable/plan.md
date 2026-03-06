

## Plan: Teacher Journal in Attendance + English-only Quiz

### 1. Teacher Journal (Teaching Log)

Add a "Teaching Journal" section below the attendance list. When a class and date are selected, the system fetches matching schedule periods for that class on that day-of-week. The teacher can then log what material was taught for each period.

**New table: `teaching_journals`**
```
- id (uuid PK)
- class_id (uuid, NOT NULL)
- date (date, NOT NULL)
- schedule_id (uuid, FK → class_schedules, nullable)
- period_label (text) — e.g. "09:00 – 10:00 English"
- topic (text) — what was taught
- notes (text, nullable) — additional notes
- created_at (timestamptz)
```
RLS: Teachers full CRUD access.

**UI in `AdminAttendance.tsx`**:
- Below the student list and Save Attendance button, add a "Teaching Journal" section
- Auto-fetch schedule periods for the selected class matching the selected date's day-of-week (from `class_schedules`)
- For each period, show: time slot label + a text input for "Topic/Material taught" + optional notes textarea
- Save journal entries alongside or separately from attendance
- If no schedule periods exist for that day, show a free-form single entry

```text
── Attendance ──────────────────────
Class: [10A ▼]    Date: [2026-03-06]

Ali       [Present] [Absent] [Late]
Budi      [Present] [Absent] [Late]

[💾 Save Attendance]

── Teaching Journal ────────────────
09:00–10:00 English
  Topic: [ Present Simple Tense        ]
  Notes: [ Students practiced exercises ]

10:00–11:00 English  
  Topic: [ Reading Comprehension        ]
  Notes: [                              ]

[💾 Save Journal]
```

### 2. English-only Quiz Generator

**`AiQuizGenerator.tsx`** changes:
- Remove language selector entirely (Indonesian/Malay options)
- Hardcode language as "English" in the API call
- Update UI labels to English since the platform is for English teachers

### Files

| File | Change |
|------|--------|
| Migration | Create `teaching_journals` table with RLS |
| `src/pages/AdminAttendance.tsx` | Add Teaching Journal section with schedule-period integration |
| `src/components/admin/AiQuizGenerator.tsx` | Remove language selector, hardcode English |

