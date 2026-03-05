
-- Add class_id to materials
ALTER TABLE public.materials ADD COLUMN class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- Add class_id to quizzes
ALTER TABLE public.quizzes ADD COLUMN class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- Add join_code to classes
ALTER TABLE public.classes ADD COLUMN join_code text UNIQUE;

-- Create manual_grades table
CREATE TABLE public.manual_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  title text NOT NULL,
  score numeric NOT NULL,
  max_score numeric NOT NULL DEFAULT 100,
  feedback text,
  grade_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_grades ENABLE ROW LEVEL SECURITY;

-- Teacher full access
CREATE POLICY "Teachers full access manual_grades"
ON public.manual_grades FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Students can view own grades
CREATE POLICY "Students can view own manual_grades"
ON public.manual_grades FOR SELECT TO authenticated
USING (auth.uid() = student_id);
