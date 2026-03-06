
-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  class_id uuid REFERENCES public.classes(id),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create lesson_completions table
CREATE TABLE public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, student_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- Courses RLS
CREATE POLICY "Teachers full access courses" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view published courses for their class" ON public.courses FOR SELECT TO authenticated
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.class_id = courses.class_id
  ));

-- Lessons RLS
CREATE POLICY "Teachers full access lessons" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view lessons of published courses" ON public.lessons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.class_id = c.class_id
    WHERE c.id = lessons.course_id AND c.is_published = true AND p.id = auth.uid()
  ));

-- Lesson completions RLS
CREATE POLICY "Students can insert own completions" ON public.lesson_completions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own completions" ON public.lesson_completions FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own completions" ON public.lesson_completions FOR DELETE TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all completions" ON public.lesson_completions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Updated_at triggers
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
