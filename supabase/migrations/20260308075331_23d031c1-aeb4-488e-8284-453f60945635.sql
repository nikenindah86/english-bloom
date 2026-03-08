ALTER TABLE public.quizzes ADD COLUMN anti_cheat boolean NOT NULL DEFAULT false;
ALTER TABLE public.assessments ADD COLUMN anti_cheat boolean NOT NULL DEFAULT false;