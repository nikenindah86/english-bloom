
-- Create assessment_class_assignments table
CREATE TABLE public.assessment_class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, class_id)
);

ALTER TABLE public.assessment_class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access assessment_class_assignments" ON public.assessment_class_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view assessment class assignments" ON public.assessment_class_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.class_id = assessment_class_assignments.class_id
  ));

-- Create assessment_student_assignments table
CREATE TABLE public.assessment_student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  purpose text DEFAULT 'remedial',
  created_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

ALTER TABLE public.assessment_student_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access assessment_student_assignments" ON public.assessment_student_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view own student assignments" ON public.assessment_student_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

-- Make class_id nullable on assessments for backward compat
ALTER TABLE public.assessments ALTER COLUMN class_id DROP NOT NULL;
