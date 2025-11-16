-- Fix RLS policies for storage.objects on 'course-materials' bucket
-- Existing policies reference courses.name instead of storage.objects.name; replace with storage.foldername(name)[1]

-- Upload
DROP POLICY IF EXISTS "Teachers can upload course materials" ON storage.objects;
CREATE POLICY "Teachers can upload course materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials'
  AND auth.uid() IN (
    SELECT teacher_id FROM public.courses
    WHERE courses.id::text = (storage.foldername(name))[1]
  )
);

-- Update
DROP POLICY IF EXISTS "Teachers can update course materials" ON storage.objects;
CREATE POLICY "Teachers can update course materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND auth.uid() IN (
    SELECT teacher_id FROM public.courses
    WHERE courses.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'course-materials'
  AND auth.uid() IN (
    SELECT teacher_id FROM public.courses
    WHERE courses.id::text = (storage.foldername(name))[1]
  )
);

-- Delete
DROP POLICY IF EXISTS "Teachers can delete course materials" ON storage.objects;
CREATE POLICY "Teachers can delete course materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND auth.uid() IN (
    SELECT teacher_id FROM public.courses
    WHERE courses.id::text = (storage.foldername(name))[1]
  )
);

-- Download (teachers and enrolled students)
DROP POLICY IF EXISTS "Users can download course materials" ON storage.objects;
CREATE POLICY "Users can download course materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    auth.uid() IN (
      SELECT teacher_id FROM public.courses
      WHERE courses.id::text = (storage.foldername(name))[1]
    )
    OR auth.uid() IN (
      SELECT enrollments.student_id FROM public.enrollments
      WHERE enrollments.course_id::text = (storage.foldername(name))[1]
    )
  )
);
