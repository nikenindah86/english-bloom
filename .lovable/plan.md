

## Plan: Fix TKA Language, Multi-Genre Support & Assessment Assignment

### 3 Issues to Fix

**Issue 1: Questions generated in Indonesian instead of English**
The TKA prompts don't explicitly say "Write all questions and options in English." The image shows questions in Indonesian. Fix: add explicit language instruction to the edge function prompts.

**Issue 2: TKA only supports 1 jenis teks per assessment**
Currently TKA Step 1 picks a single `jenisTeks`. Real TKA exams contain multiple text types. Fix: Move `jenisTeks` from Step 1 into the basket — each basket item gets its own jenis teks + its own optional reading passage. The outline and question generation then handle multiple text types, each with its own passage.

**Issue 3: Assessment assignment to multiple classes and specific students**
Currently `assessments` has a single `class_id` column. Need a many-to-many relationship. Also need ability to assign to specific students (for remedial/enrichment).

### Changes

| File | Change |
|------|--------|
| **DB Migration** | Create `assessment_class_assignments` (assessment_id, class_id) and `assessment_student_assignments` (assessment_id, student_id, purpose: 'remedial'/'pengayaan') tables. Keep existing `class_id` on assessments for backward compat but make it nullable. |
| **`generate-assessment/index.ts`** | Add `"IMPORTANT: Write ALL question_text and ALL options in English."` to both outline and question generation prompts. Update TKA mode to accept basket items with per-item `jenis_teks` and generate passages per text type. |
| **`src/constants/tkaFramework.ts`** | Add `jenis_teks` field to `TkaBasketItem` type. |
| **`src/components/admin/TkaBuilder.tsx`** | Move jenis teks selector from Step 1 into the basket form (Step 2). Each basket item now has its own jenis teks. Update outline generation to pass per-item jenis_teks. Remove jenisTeks from Step 1. Add topic field to Step 1 (separate from title). Update save to use new assignment tables. |
| **`src/pages/AdminAssessments.tsx`** | Replace single class selector with multi-class selector (checkboxes). Add "Assign to specific students" section with student search/select. Update save logic to insert into assignment tables. Update formative builder similarly. |
| **`src/pages/StudentAssessments.tsx`** | Update query to check both `assessment_class_assignments` and `assessment_student_assignments` tables instead of just `assessments.class_id`. |

### TKA Multi-Genre Flow

Step 1: Title, Topic, Tingkat (B1/A2), Duration
Step 2: Basket — each item now includes: Jenis Teks dropdown + Bentuk Soal + Opsi + Jumlah + Kompetensi + Subkompetensi + Include Passage
Step 3: Generate outline (groups by jenis teks, generates passage per text type if needed)
Step 4: Review generated questions grouped by text type

### Edge Function: Multi-Genre TKA

When `mode: "tka"`, basket items now carry `jenis_teks`. The function:
1. Groups basket items by jenis_teks
2. For outline: generates outline items tagged with their jenis_teks
3. For questions: generates one passage per jenis_teks (if passage requested), then generates questions for each group referencing its passage

### Assignment DB Schema

```sql
CREATE TABLE assessment_class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, class_id)
);

CREATE TABLE assessment_student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  purpose text DEFAULT 'remedial',
  created_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);
```

### Assignment UI

In both Formative and TKA builders, replace the single "Kelas" dropdown with:
- Multi-select checkboxes for classes
- "Assign to specific students" expandable section with student list (filtered by selected classes), each with a purpose tag (Remedial/Pengayaan)

