
-- quiz_questions table
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text_input',
  media_url text,
  options jsonb,
  correct_answer text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access quiz_questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students can view questions of active quizzes" ON public.quiz_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.is_active = true));

-- submission_answers table
CREATE TABLE public.submission_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.quiz_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id),
  answer_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own answers" ON public.submission_answers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_submissions WHERE quiz_submissions.id = submission_answers.submission_id AND quiz_submissions.student_id = auth.uid()));
CREATE POLICY "Students can view own answers" ON public.submission_answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quiz_submissions WHERE quiz_submissions.id = submission_answers.submission_id AND quiz_submissions.student_id = auth.uid()));
CREATE POLICY "Teachers can view all answers" ON public.submission_answers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'));

-- attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers full access attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = student_id);

-- Enable realtime on quiz_submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_submissions;
