

## Plan: Comprehensive Lesson Plans Menu

### Concept
A dedicated "Lesson Plans" page where teachers can create detailed weekly/term lesson plans per class. Each plan includes structured fields common in English teaching: learning objectives, core competencies, materials/resources, teaching activities (intro/main/closing), assessment methods, and time allocation. Plans link to existing classes and schedules.

### Database

**New table: `lesson_plans`**
```
- id (uuid PK)
- class_id (uuid, NOT NULL, FK → classes)
- title (text) — e.g. "Week 3 – Present Perfect Tense"
- week_number (integer, nullable)
- date_start (date, nullable)
- date_end (date, nullable)
- topic (text) — main topic
- learning_objectives (text) — what students will achieve
- core_competencies (text, nullable) — KD/standards
- materials_resources (text, nullable) — textbooks, media, links
- opening_activity (text, nullable) — warm-up / intro
- main_activity (text, nullable) — core lesson steps
- closing_activity (text, nullable) — wrap-up / reflection
- assessment_method (text, nullable) — how to evaluate
- time_allocation (text, nullable) — e.g. "2 x 45 minutes"
- notes (text, nullable)
- status (text, default 'draft') — draft / published
- created_at (timestamptz)
```
RLS: Teachers full CRUD.

### UI: `src/pages/AdminLessonPlans.tsx`

- **List view**: Filter by class, shows cards with title, topic, week, status badge (draft/published)
- **Create/Edit dialog**: Structured form with labeled sections:
  - Class selector, Title, Week number, Date range
  - Topic, Learning Objectives (textarea)
  - Core Competencies (textarea)
  - Materials & Resources (textarea)
  - Teaching Activities: Opening / Main / Closing (3 textareas)
  - Assessment Method, Time Allocation
  - Notes, Status toggle (Draft/Published)
- **Delete** with confirmation
- **Duplicate** button to clone a plan for another week/class

### Navigation
- Add "Lesson Plans" to sidebar under Academic section (with `BookOpen` or `NotebookPen` icon)
- Add to mobile icon grid on AdminDashboard
- Add route `/admin/lesson-plans` in App.tsx

### Files

| File | Change |
|------|--------|
| Migration | Create `lesson_plans` table with RLS |
| `src/pages/AdminLessonPlans.tsx` | New page with list + create/edit/delete/duplicate |
| `src/App.tsx` | Add route `/admin/lesson-plans` |
| `src/components/admin/AdminLayout.tsx` | Add sidebar menu item |
| `src/pages/AdminDashboard.tsx` | Add to mobile icon grid |

