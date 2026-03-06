

## Plan: Add TKA Tab to Assessments with Framework-Based Question Generation

### Overview

Split AdminAssessments into two tabs using the existing Tabs component. Tab 1 keeps current Formative-Summative builder. Tab 2 adds a TKA builder that **strictly follows the framework from the GitHub repo** — no improvisation. The TKA framework data (jenis teks, kompetensi, subkompetensi, matriks asesmen) will be hardcoded as constants and passed verbatim to the AI prompt.

### TKA Framework Data (from repo, hardcoded)

**Jenis Teks:** descriptive, recount, narrative, procedure, analytical exposition

**Kompetensi Levels:**
1. Pemahaman Tekstual (5 subkompetensi)
2. Pemahaman Inferensial (7 subkompetensi)
3. Evaluasi dan Apresiasi (5 subkompetensi)

**Bentuk Soal:** PG (4-5 opsi), PGK Kategori (categorization T/F), PGK MCMA (multiple correct)

**Text characteristics:** B1 (250-350 words), A2 (200-300 words)

### TKA Tab UI Flow

```text
┌─ TKA Builder ────────────────────────────┐
│ Title: [________________]                │
│ Jenis Teks: [Narrative ▼]               │
│ Class: [______▼]  Duration: [60]         │
│ Tingkat: [●B1] [A2]                      │
│                                          │
│ ┌─ TAMBAH BENTUK SOAL ────────────────┐  │
│ │ Bentuk: [PG Biasa    ▼]            │  │
│ │ Jumlah Opsi: [●4] [5]             │  │
│ │ Jumlah Soal: [10]                  │  │
│ │ Kompetensi: [Pemahaman Tekstual ▼] │  │
│ │ Subkompetensi: [checkboxes...]     │  │
│ │ ☐ Include Reading Passage          │  │
│ │ [+ Tambah ke Keranjang]            │  │
│ └────────────────────────────────────┘  │
│                                          │
│ KERANJANG SOAL                           │
│ ┌ PG (4 opsi) — 5 soal — Tekstual  🗑 ┐ │
│ ┌ PGK Kategori — 5 soal — Infer.   🗑 ┐ │
│                         Total: 10 soal   │
│                                          │
│ [✨ Generate Outline]                    │
│                                          │
│ ── Outline Table (editable) ──           │
│ No | Subkompetensi | Deskripsi | Bentuk  │
│  1 | [from matrix] | [edit]    | PG      │
│                                          │
│ [Approve & Generate Soal]                │
└──────────────────────────────────────────┘
```

### Key Design Decisions

1. **Framework data hardcoded** — The full matriks_asesmen (kompetensi + subkompetensi) is stored as a TypeScript constant. The AI prompt includes the exact subkompetensi text so the AI cannot deviate.

2. **Outline-first for both tabs** — AI first generates an outline (subkompetensi assignment per question) → admin reviews/edits → then generates actual questions. For Formative-Summative tab, outline uses Bloom's C1-C6. For TKA tab, outline uses the 3 kompetensi levels + subkompetensi.

3. **Reading passage generated on "Generate" click** — Not a separate step. When basket has reading passage checked, the generate call produces passage + questions together.

4. **Total question count** shown prominently in both tabs.

5. **PGK Kategori** = categorization questions where each statement maps to a category (like Similarity/Difference). Stored as `true_false_statement` type but with custom categories from the framework.

### Files

| File | Change |
|------|--------|
| `src/pages/AdminAssessments.tsx` | Major rewrite: wrap in Tabs. Tab 1 = existing flow with outline step added. Tab 2 = TKA builder with basket UI, kompetensi/subkompetensi selectors, outline dialog, and framework constants. Both share assessment list + save logic. |
| `supabase/functions/generate-assessment/index.ts` | Add `mode: "tka"` support: accept `jenis_teks`, `tingkat` (A2/B1), `kompetensi_items` (array of {subkompetensi, bentuk_soal, num_options}), `generate_outline` flag. TKA prompt includes full framework text verbatim. Add outline generation mode for both tabs. |
| `src/pages/StudentAssessment.tsx` | Handle PGK Kategori rendering (categorization with custom labels, not just True/False). |

### Edge Function: TKA Mode

When `mode: "tka"`, the prompt will include:
- The exact framework definition text
- The selected jenis_teks and tingkat_kemahiran characteristics
- For each question in the basket: the exact subkompetensi text from the matrix, bentuk_soal, and num_options
- The reading passage (if generated)

The AI is instructed: "You MUST use ONLY the subkompetensi provided. Do NOT create questions outside the given framework."

### Outline Structure

```json
{
  "outline": [
    {
      "no": 1,
      "kompetensi": "Pemahaman Inferensial",
      "subkompetensi": "Menyimpulkan hubungan sebab-akibat...",
      "bentuk_soal": "PG",
      "num_options": 5,
      "deskripsi_soal": "Brief description of what the question will test"
    }
  ]
}
```

Admin can edit `deskripsi_soal` before approving. The approved outline is then sent back to generate actual questions that match each row exactly.

### Database

No schema changes needed — existing `assessment_sections` and `assessment_questions` tables can store TKA data. Add a `type` column to `assessments` table to distinguish "formative" vs "tka" assessments (optional, or store in description/metadata).

**Migration**: Add `assessment_type` column (text, default 'formative') to `assessments` table so we can filter/display them correctly.

