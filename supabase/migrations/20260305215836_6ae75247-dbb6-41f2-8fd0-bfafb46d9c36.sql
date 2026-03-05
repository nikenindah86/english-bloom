
-- 1. assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  max_score numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students can view class assignments" ON public.assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND class_id = assignments.class_id));

-- 2. assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  file_url text,
  note text,
  score numeric,
  feedback text,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access assignment_submissions" ON public.assignment_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students can insert own submission" ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

-- 3. stream_comments table
CREATE TABLE public.stream_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stream_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view comments" ON public.stream_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert own comments" ON public.stream_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can delete any comment" ON public.stream_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- 4. class_schedules table
CREATE TABLE public.class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access class_schedules" ON public.class_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students can view own class schedules" ON public.class_schedules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND class_id = class_schedules.class_id));

-- 5. notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Teachers can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- 6. student_notes table
CREATE TABLE public.student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers full access student_notes" ON public.student_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teacher')) WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- 7. Add is_archived to classes
ALTER TABLE public.classes ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- 8. Create assignments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true);

-- Storage RLS for assignments bucket
CREATE POLICY "Anyone can read assignment files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignments');
CREATE POLICY "Authenticated can upload assignment files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignments');
CREATE POLICY "Teachers can delete assignment files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assignments' AND public.has_role(auth.uid(), 'teacher'));
