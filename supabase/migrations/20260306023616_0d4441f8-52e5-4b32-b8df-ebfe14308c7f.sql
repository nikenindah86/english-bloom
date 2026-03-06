
CREATE TABLE public.grade_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_score numeric NOT NULL DEFAULT 100,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access grade_categories"
  ON public.grade_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Students can view own class categories"
  ON public.grade_categories FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.class_id = grade_categories.class_id
  ));
