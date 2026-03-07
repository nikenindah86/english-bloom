
CREATE TABLE public.grading_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL UNIQUE REFERENCES public.classes(id) ON DELETE CASCADE,
  passing_grade numeric NOT NULL DEFAULT 75,
  quiz_weight numeric NOT NULL DEFAULT 25,
  assessment_weight numeric NOT NULL DEFAULT 25,
  manual_weight numeric NOT NULL DEFAULT 25,
  attendance_weight numeric NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grading_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access grading_config"
ON public.grading_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view own class grading_config"
ON public.grading_config FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.class_id = grading_config.class_id
  )
);
