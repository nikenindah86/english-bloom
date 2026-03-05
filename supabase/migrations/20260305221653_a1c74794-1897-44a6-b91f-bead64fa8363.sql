
-- Add gamification columns to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_limit integer;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_answers_after boolean NOT NULL DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_questions boolean NOT NULL DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_options boolean NOT NULL DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS points_per_question integer NOT NULL DEFAULT 100;

-- Add gamification columns to submission_answers
ALTER TABLE public.submission_answers ADD COLUMN IF NOT EXISTS is_correct boolean;
ALTER TABLE public.submission_answers ADD COLUMN IF NOT EXISTS time_taken_ms integer;
ALTER TABLE public.submission_answers ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;
