-- Add credits field to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS credits integer DEFAULT 3;

COMMENT ON COLUMN public.courses.credits IS 'Number of academic credits for the course';