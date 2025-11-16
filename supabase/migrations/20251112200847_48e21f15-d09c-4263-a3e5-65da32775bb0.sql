-- Tabla para actividades de calificación (talleres, exámenes, etc.)
CREATE TABLE IF NOT EXISTS public.grade_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  corte INTEGER NOT NULL CHECK (corte IN (1, 2, 3)),
  percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para calificaciones de cada actividad por estudiante
CREATE TABLE IF NOT EXISTS public.activity_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.grade_activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade NUMERIC CHECK (grade >= 0 AND grade <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(activity_id, student_id)
);

-- Tabla para asistencia
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  present BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, student_id, date)
);

-- RLS para grade_activities
ALTER TABLE public.grade_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read grade_activities"
  ON public.grade_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage grade_activities"
  ON public.grade_activities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS para activity_grades
ALTER TABLE public.activity_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read activity_grades"
  ON public.activity_grades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage activity_grades"
  ON public.activity_grades FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS para attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);