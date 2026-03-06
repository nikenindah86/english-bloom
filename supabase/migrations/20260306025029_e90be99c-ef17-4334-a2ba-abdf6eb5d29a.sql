
CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  week_number integer,
  date_start date,
  date_end date,
  topic text NOT NULL DEFAULT '',
  learning_objectives text NOT NULL DEFAULT '',
  core_competencies text,
  materials_resources text,
  opening_activity text,
  main_activity text,
  closing_activity text,
  assessment_method text,
  time_allocation text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access lesson_plans"
  ON public.lesson_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
