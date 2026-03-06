
-- assessments table
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) NOT NULL,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assessments" ON public.assessments FOR ALL TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can view active assessments for their class" ON public.assessments FOR SELECT TO authenticated USING (is_active = true AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.class_id = assessments.class_id));

-- assessment_sections table
CREATE TABLE public.assessment_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '',
  question_type text NOT NULL DEFAULT 'multiple_choice',
  num_questions integer NOT NULL DEFAULT 5,
  reading_passage text,
  difficulty_easy integer NOT NULL DEFAULT 0,
  difficulty_medium integer NOT NULL DEFAULT 0,
  difficulty_hard integer NOT NULL DEFAULT 0,
  cognitive_levels jsonb DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assessment_sections" ON public.assessment_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can view sections of active assessments" ON public.assessment_sections FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_sections.assessment_id AND assessments.is_active = true AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.class_id = assessments.class_id)));

-- assessment_questions table
CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.assessment_sections(id) ON DELETE CASCADE NOT NULL,
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  options jsonb,
  correct_answer text,
  difficulty text NOT NULL DEFAULT 'medium',
  cognitive_level text NOT NULL DEFAULT 'C1',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assessment_questions" ON public.assessment_questions FOR ALL TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can view questions of active assessments" ON public.assessment_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_questions.assessment_id AND assessments.is_active = true AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.class_id = assessments.class_id)));

-- assessment_submissions table
CREATE TABLE public.assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score numeric,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assessment_submissions" ON public.assessment_submissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can insert own assessment submissions" ON public.assessment_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can view own assessment submissions" ON public.assessment_submissions FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can update own in-progress submissions" ON public.assessment_submissions FOR UPDATE TO authenticated USING (auth.uid() = student_id AND status = 'in_progress');

-- assessment_answers table
CREATE TABLE public.assessment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.assessment_submissions(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.assessment_questions(id) ON DELETE CASCADE NOT NULL,
  answer_text text,
  is_correct boolean,
  points numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assessment_answers" ON public.assessment_answers FOR ALL TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Students can insert own assessment answers" ON public.assessment_answers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM assessment_submissions WHERE assessment_submissions.id = assessment_answers.submission_id AND assessment_submissions.student_id = auth.uid()));
CREATE POLICY "Students can view own assessment answers" ON public.assessment_answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM assessment_submissions WHERE assessment_submissions.id = assessment_answers.submission_id AND assessment_submissions.student_id = auth.uid()));
CREATE POLICY "Students can update own assessment answers" ON public.assessment_answers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM assessment_submissions WHERE assessment_submissions.id = assessment_answers.submission_id AND assessment_submissions.student_id = auth.uid()));
