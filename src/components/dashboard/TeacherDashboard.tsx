import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Users, Plus, X } from "lucide-react";
import { toast } from "sonner";
import CourseCard from "./CourseCard";

interface TeacherDashboardProps {
  profile: any;
}

const TeacherDashboard = ({ profile }: TeacherDashboardProps) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    credits: 3,
    academic_period: "",
  });

  useEffect(() => {
    fetchCourses();
  }, [profile]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          enrollments(count)
        `)
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  const generateCourseCode = () => {
    const prefix = formData.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    const random = Math.floor(Math.random() * 900 + 100);
    return `${prefix}${random}`;
  };

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const code = generateCourseCode();
      const accessCode = generateAccessCode();

      const { error } = await supabase.from("courses").insert({
        name: formData.name,
        code: code,
        description: formData.description,
        credits: formData.credits,
        academic_period: formData.academic_period,
        access_code: accessCode,
        teacher_id: profile.id,
      });

      if (error) throw error;

      toast.success("Curso creado exitosamente");
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        credits: 3,
        academic_period: "",
      });
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el curso");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Mis Cursos</h2>
          <p className="text-muted-foreground mt-1">Gestiona tus cursos y estudiantes</p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Curso
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Crear Nuevo Curso</CardTitle>
                <CardDescription>Completa la información básica del curso</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del curso *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Programación Avanzada"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Créditos *</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el contenido y objetivos del curso..."
                  required
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Período académico *</Label>
                <Input
                  id="period"
                  value={formData.academic_period}
                  onChange={(e) => setFormData({ ...formData, academic_period: e.target.value })}
                  placeholder="ej. 2025-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El código del curso y el código de acceso se generarán automáticamente
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "Creando..." : "Crear Curso"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce((acc, course) => acc + (course.enrollments?.[0]?.count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No tienes cursos aún</CardTitle>
            <CardDescription>Crea tu primer curso para comenzar</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onUpdate={fetchCourses} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
