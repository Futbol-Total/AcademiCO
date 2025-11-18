import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Award } from "lucide-react";
import { toast } from "sonner";
import EnrollCourseDialog from "./EnrollCourseDialog";
import StudentCourseCard from "./StudentCourseCard";

interface StudentDashboardProps {
  profile: any;
}

const StudentDashboard = ({ profile }: StudentDashboardProps) => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, [profile]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(
            *,
            teacher:profiles!courses_teacher_id_fkey(full_name)
          ),
          grade:grades(*)
        `)
        .eq("student_id", profile.id)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      toast.error("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  const averageGrade = enrollments.reduce((acc, enrollment) => {
    const g = Array.isArray(enrollment.grade) ? enrollment.grade[0] : enrollment.grade;
    const grade = g?.final_grade as number | undefined;
    return grade ? acc + grade : acc;
  }, 0) / (enrollments.filter(e => (Array.isArray(e.grade) ? e.grade[0] : e.grade)?.final_grade).length || 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Mis Cursos</h2>
          <p className="text-muted-foreground mt-1">Ve tus cursos y calificaciones</p>
        </div>
        <Button onClick={() => setShowEnrollDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Inscribir Curso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageGrade > 0 ? averageGrade.toFixed(1) : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No estás inscrito en ningún curso</CardTitle>
            <CardDescription>Inscríbete en un curso para comenzar</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}

      <EnrollCourseDialog
        open={showEnrollDialog}
        onOpenChange={setShowEnrollDialog}
        onSuccess={fetchEnrollments}
        studentId={profile.id}
      />
    </div>
  );
};

export default StudentDashboard;
