-- Eliminar políticas existentes y recrear con las correctas
DROP POLICY IF EXISTS "Teachers can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete course materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can download course materials" ON storage.objects;

-- Permitir a profesores subir archivos a sus cursos
CREATE POLICY "Teachers can upload course materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials' 
  AND auth.uid() IN (
    SELECT teacher_id 
    FROM courses 
    WHERE id::text = (string_to_array(name, '/'))[1]
  )
);

-- Permitir a profesores actualizar archivos de sus cursos
CREATE POLICY "Teachers can update course materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND auth.uid() IN (
    SELECT teacher_id 
    FROM courses 
    WHERE id::text = (string_to_array(name, '/'))[1]
  )
);

-- Permitir a profesores eliminar archivos de sus cursos
CREATE POLICY "Teachers can delete course materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND auth.uid() IN (
    SELECT teacher_id 
    FROM courses 
    WHERE id::text = (string_to_array(name, '/'))[1]
  )
);

-- Permitir a todos los usuarios autenticados descargar materiales de cursos en los que están inscritos o enseñan
CREATE POLICY "Users can download course materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    -- Profesores pueden ver materiales de sus cursos
    auth.uid() IN (
      SELECT teacher_id 
      FROM courses 
      WHERE id::text = (string_to_array(name, '/'))[1]
    )
    OR
    -- Estudiantes pueden ver materiales de cursos en los que están inscritos
    auth.uid() IN (
      SELECT student_id 
      FROM enrollments 
      WHERE course_id::text = (string_to_array(name, '/'))[1]
    )
  )
);