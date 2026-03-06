
ALTER TABLE public.quizzes ADD COLUMN scheduled_at timestamptz DEFAULT NULL;
ALTER TABLE public.quizzes ADD COLUMN expires_at timestamptz DEFAULT NULL;

ALTER TABLE public.assessments ADD COLUMN scheduled_at timestamptz DEFAULT NULL;
ALTER TABLE public.assessments ADD COLUMN expires_at timestamptz DEFAULT NULL;

ALTER TABLE public.assignments ADD COLUMN scheduled_at timestamptz DEFAULT NULL;
ALTER TABLE public.assignments ADD COLUMN expires_at timestamptz DEFAULT NULL;
