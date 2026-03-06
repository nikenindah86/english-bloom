
CREATE TABLE public.teaching_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  schedule_id uuid REFERENCES public.class_schedules(id) ON DELETE SET NULL,
  period_label text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access teaching_journals"
  ON public.teaching_journals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
