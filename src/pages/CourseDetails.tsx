import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, BarChart3, Save, Calendar as CalendarIcon, AlertTriangle, FileText } from "lucide-react";
import { CourseMaterialsUpload } from "@/components/course/CourseMaterialsUpload";
import { CourseMaterialsList } from "@/components/course/CourseMaterialsList";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [grades, setGrades] = useState<any>({});
  const [attendance, setAttendance] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [newActivity, setNewActivity] = useState({ name: "", corte: 1, percentage: 0 });
  const [editingGrades, setEditingGrades] = useState<any>({});
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [materialsRefresh, setMaterialsRefresh] = useState(0);

  // Ayudante: 'grade' puede venir como objeto o como arreglo con un único elemento
  const getGrade = (g: any) => (Array.isArray(g) ? g[0] : g);

  // Aplicar margen de redondeo de 0.02
  const applyRoundingMargin = (grade: number): number => {
    if (grade <= 0) return grade;
    const decimal = grade - Math.floor(grade);
    // Si la parte decimal está entre 0.98 y 1.0, redondear hacia arriba
    if (decimal >= 0.98) {
      return Math.min(Math.ceil(grade), 5.0);
    }
    return Math.min(grade, 5.0);
  };

  useEffect(() => {
    fetchProfile();
    fetchCourseData();
  }, [courseId]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchCourseData = async () => {
    try {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*, teacher:profiles!courses_teacher_id_fkey(full_name)")
        .eq("id", courseId)
        .single();
      setCourse(courseData);

      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("*, student:profiles!enrollments_student_id_fkey(*), grade:grades(*)")
        .eq("course_id", courseId);
      setStudents(enrollmentsData || []);

      const { data: activitiesData } = await supabase
        .from("grade_activities")
        .select("*")
        .eq("course_id", courseId)
        .order("corte", { ascending: true });
      setActivities(activitiesData || []);

      if (activitiesData) {
        const { data: activityGradesData } = await supabase
          .from("activity_grades")
          .select("*")
          .in("activity_id", activitiesData.map(a => a.id));
        
        const gradesMap: any = {};
        activityGradesData?.forEach((ag: any) => {
          if (!gradesMap[ag.student_id]) gradesMap[ag.student_id] = {};
          gradesMap[ag.student_id][ag.activity_id] = ag.grade;
        });
        setGrades(gradesMap);
      }

      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("course_id", courseId);
      
      const attendanceMap: any = {};
      attendanceData?.forEach((att: any) => {
        if (!attendanceMap[att.student_id]) attendanceMap[att.student_id] = [];
        attendanceMap[att.student_id].push(att);
      });
      setAttendance(attendanceMap);

    } catch (error: any) {
      toast.error("Error al cargar los datos del curso");
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async () => {
    if (!newActivity.name || newActivity.percentage <= 0) {
      toast.error("Completa todos los campos");
      return;
    }

    const corteActivities = activities.filter(a => a.corte === newActivity.corte);
    const currentPercentage = corteActivities.reduce((sum, a) => sum + parseFloat(a.percentage), 0);
    const maxPercentage = newActivity.corte === 1 ? 30 : 35;

    if (currentPercentage + newActivity.percentage > maxPercentage) {
      toast.error(`El corte ${newActivity.corte} solo permite ${maxPercentage}% total. Ya tienes ${currentPercentage}% asignado.`);
      return;
    }

    try {
      await supabase.from("grade_activities").insert({
        course_id: courseId,
        name: newActivity.name,
        corte: newActivity.corte,
        percentage: newActivity.percentage
      });
      
      toast.success("Actividad agregada");
      setNewActivity({ name: "", corte: 1, percentage: 0 });
      fetchCourseData();
    } catch (error) {
      toast.error("Error al agregar actividad");
    }
  };

  const deleteActivity = async (activityId: string) => {
    try {
      await supabase.from("grade_activities").delete().eq("id", activityId);
      toast.success("Actividad eliminada");
      fetchCourseData();
    } catch (error) {
      toast.error("Error al eliminar actividad");
    }
  };

  const handleGradeChange = (studentId: string, activityId: string, value: string) => {
    setEditingGrades((prev: any) => ({
      ...prev,
      [`${studentId}-${activityId}`]: value
    }));
  };

  const updateGrade = async (studentId: string, activityId: string) => {
    const key = `${studentId}-${activityId}`;
    const value = editingGrades[key];
    
    if (value === undefined || value === "") {
      return;
    }

    const grade = parseFloat(value);
    
    if (isNaN(grade)) {
      toast.error("Ingresa un número válido");
      setEditingGrades((prev: any) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      return;
    }

    if (grade < 0 || grade > 5) {
      toast.error("La calificación debe estar entre 0 y 5");
      setEditingGrades((prev: any) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      return;
    }

    setSavingGrade(key);

    try {
      await supabase.from("activity_grades").upsert({
        activity_id: activityId,
        student_id: studentId,
        grade: grade
      });

      await recalculateFinalGrades(studentId);
      
      setGrades((prev: any) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [activityId]: grade }
      }));

      setEditingGrades((prev: any) => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });

      toast.success("Nota guardada");
    } catch (error) {
      toast.error("Error al actualizar calificación");
    } finally {
      setSavingGrade(null);
    }
  };

  const recalculateFinalGrades = async (studentId: string) => {
    // Obtener las calificaciones más recientes de este estudiante
    const { data: activityGradesData } = await supabase
      .from("activity_grades")
      .select("*")
      .eq("student_id", studentId);

    const studentGrades: any = {};
    activityGradesData?.forEach((ag: any) => {
      studentGrades[ag.activity_id] = ag.grade;
    });
    
    // Calcular porcentaje total usado en cada corte
    const corte1Total = activities.filter(a => a.corte === 1).reduce((sum, a) => sum + parseFloat(a.percentage), 0);
    const corte2Total = activities.filter(a => a.corte === 2).reduce((sum, a) => sum + parseFloat(a.percentage), 0);
    const corte3Total = activities.filter(a => a.corte === 3).reduce((sum, a) => sum + parseFloat(a.percentage), 0);
    
    let corte1 = 0, corte2 = 0, corte3 = 0;
    
    // Calcular nota ponderada para cada corte
    activities.forEach(activity => {
      const grade = studentGrades[activity.id];
      if (grade !== undefined && grade !== null) {
        const weight = parseFloat(activity.percentage);
        
        if (activity.corte === 1 && corte1Total > 0) {
          corte1 += grade * (weight / corte1Total);
        }
        if (activity.corte === 2 && corte2Total > 0) {
          corte2 += grade * (weight / corte2Total);
        }
        if (activity.corte === 3 && corte3Total > 0) {
          corte3 += grade * (weight / corte3Total);
        }
      }
    });

    // Aplicar margen de redondeo a cada nota
    corte1 = corte1 > 0 ? applyRoundingMargin(corte1) : 0;
    corte2 = corte2 > 0 ? applyRoundingMargin(corte2) : 0;
    corte3 = corte3 > 0 ? applyRoundingMargin(corte3) : 0;

    const finalGrade = applyRoundingMargin((corte1 * 0.3) + (corte2 * 0.35) + (corte3 * 0.35));

    const enrollment = students.find(s => s.student_id === studentId);
    if (enrollment) {
      await supabase.from("grades").upsert({
        enrollment_id: enrollment.id,
        student_id: studentId,
        course_id: courseId,
        student_name: enrollment.student.full_name,
        corte1: corte1 > 0 ? corte1 : null,
        corte2: corte2 > 0 ? corte2 : null,
        corte3: corte3 > 0 ? corte3 : null,
        final_grade: finalGrade > 0 ? finalGrade : null
      }, { onConflict: 'enrollment_id' });
    }
  };

  const toggleAttendance = async (studentId: string, date: string) => {
    const existing = attendance[studentId]?.find((a: any) => a.date === date);

    try {
      if (existing) {
        await supabase.from("attendance").update({ present: !existing.present }).eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({
          course_id: courseId,
          student_id: studentId,
          date: date,
          present: true
        });
      }
      fetchCourseData();
    } catch (error) {
      toast.error("Error al actualizar asistencia");
    }
  };

  const saveAllAttendance = async () => {
    toast.success("Asistencia guardada correctamente");
  };

  const saveAllGrades = async () => {
    try {
      // Recalculate all student grades
      for (const student of students) {
        await recalculateFinalGrades(student.student_id);
      }
      toast.success("Todas las notas han sido guardadas y calculadas");
      fetchCourseData();
    } catch (error) {
      toast.error("Error al guardar las notas");
    }
  };

  const deleteCourse = async () => {
    setDeletingCourse(true);
    try {
      // Delete all activity grades
      const activityIds = activities.map(a => a.id);
      if (activityIds.length > 0) {
        await supabase.from("activity_grades").delete().in("activity_id", activityIds);
      }

      // Delete all activities
      await supabase.from("grade_activities").delete().eq("course_id", courseId);

      // Delete all attendance records
      await supabase.from("attendance").delete().eq("course_id", courseId);

      // Delete all grades
      await supabase.from("grades").delete().eq("course_id", courseId);

      // Delete all enrollments
      await supabase.from("enrollments").delete().eq("course_id", courseId);

      // Finally delete the course
      await supabase.from("courses").delete().eq("id", courseId);

      toast.success("Clase eliminada permanentemente");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Error al eliminar la clase");
      setDeletingCourse(false);
    }
  };

  const getCortePercentages = () => {
    const result = [
      { corte: 1, used: 0, max: 30 },
      { corte: 2, used: 0, max: 35 },
      { corte: 3, used: 0, max: 35 }
    ];

    activities.forEach(activity => {
      const corteIndex = activity.corte - 1;
      result[corteIndex].used += parseFloat(activity.percentage);
    });

    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Curso no encontrado</p>
      </div>
    );
  }

  const isTeacher = profile?.role === "teacher";
  const cortePercentages = getCortePercentages();

  if (!isTeacher) {
    const enrollment = students.find(s => s.student_id === profile?.id);
    const myGrade = getGrade(enrollment?.grade);
    
    const chartData = [
      { name: 'Corte 1', nota: myGrade?.corte1 || 0, maximo: 5 },
      { name: 'Corte 2', nota: myGrade?.corte2 || 0, maximo: 5 },
      { name: 'Corte 3', nota: myGrade?.corte3 || 0, maximo: 5 },
    ];

    const myActivities = activities.map(activity => ({
      ...activity,
      grade: grades[profile?.id]?.[activity.id] || null
    }));

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 p-6">
        <div className="container mx-auto max-w-6xl">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl">{course.name}</CardTitle>
                  <CardDescription className="mt-2">{course.code}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg">{course.academic_period}</Badge>
              </div>
              <p className="text-muted-foreground mt-4">{course.description}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Profesor: {course.teacher?.full_name}
              </p>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Corte 1</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myGrade?.corte1?.toFixed(1) || "--"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Corte 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myGrade?.corte2?.toFixed(1) || "--"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Corte 3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myGrade?.corte3?.toFixed(1) || "--"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nota Final</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{myGrade?.final_grade?.toFixed(1) || "--"}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progreso de Calificaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nota" fill="hsl(var(--primary))" name="Tu Nota" />
                  <Bar dataKey="maximo" fill="hsl(var(--muted))" name="Máximo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividades y Calificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3].map(corte => {
                  const corteActivities = myActivities.filter(a => a.corte === corte);
                  if (corteActivities.length === 0) return null;
                  
                  return (
                    <div key={corte}>
                      <h3 className="font-semibold mb-2">Corte {corte}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Actividad</TableHead>
                            <TableHead>Peso</TableHead>
                            <TableHead>Calificación</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {corteActivities.map(activity => (
                            <TableRow key={activity.id}>
                              <TableCell>{activity.name}</TableCell>
                              <TableCell>{activity.percentage}%</TableCell>
                              <TableCell>
                                <Badge variant={activity.grade ? "default" : "secondary"}>
                                  {activity.grade ? activity.grade.toFixed(1) : "--"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Materiales del Curso
              </CardTitle>
              <CardDescription>Recursos y documentos disponibles para descargar</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseMaterialsList 
                courseId={courseId!} 
                isTeacher={false}
                refreshTrigger={materialsRefresh}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 p-6">
      <div className="container mx-auto max-w-7xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{course.name}</CardTitle>
                <CardDescription className="mt-2">{course.code}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg">{course.academic_period}</Badge>
            </div>
            <p className="text-muted-foreground mt-4">{course.description}</p>
            <p className="text-sm text-muted-foreground mt-2">{students.length} estudiantes inscritos</p>
          </CardHeader>
        </Card>

        <div className="flex justify-end mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deletingCourse}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Eliminar Clase Permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la clase y todos los datos asociados:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Todas las actividades y sus calificaciones</li>
                    <li>Todos los registros de asistencia</li>
                    <li>Lista completa de estudiantes inscritos</li>
                    <li>Calificaciones de todos los cortes</li>
                  </ul>
                  <p className="mt-2 font-bold">Ni estudiantes ni docentes podrán ver ningún dato de esta clase.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sí, eliminar permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="attendance">Asistencia</TabsTrigger>
            <TabsTrigger value="materials">
              <FileText className="h-4 w-4 mr-2" />
              Materiales
            </TabsTrigger>
            <TabsTrigger value="students">Listado de Estudiantes</TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agregar Actividad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nombre de la actividad</Label>
                    <Input
                      placeholder="Ej: Taller 1"
                      value={newActivity.name}
                      onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Corte</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newActivity.corte}
                      onChange={(e) => setNewActivity({ ...newActivity, corte: parseInt(e.target.value) })}
                    >
                      <option value={1}>Corte 1 (30%)</option>
                      <option value={2}>Corte 2 (35%)</option>
                      <option value={3}>Corte 3 (35%)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Porcentaje (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newActivity.percentage || ""}
                      onChange={(e) => setNewActivity({ ...newActivity, percentage: parseFloat(e.target.value) })}
                    />
                  </div>
                  <Button onClick={addActivity} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Actividad
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Porcentajes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cortePercentages.map(({ corte, used, max }) => (
                    <div key={corte}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Corte {corte}</span>
                        <span className="text-sm text-muted-foreground">{used.toFixed(1)}% / {max}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${used > max ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min((used / max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mb-4">
              <Button onClick={saveAllGrades} className="gap-2">
                <Save className="h-4 w-4" />
                Asentar Notas
              </Button>
            </div>

            <Tabs defaultValue="total" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="corte1">Corte 1</TabsTrigger>
                <TabsTrigger value="corte2">Corte 2</TabsTrigger>
                <TabsTrigger value="corte3">Corte 3</TabsTrigger>
                <TabsTrigger value="total">Total</TabsTrigger>
              </TabsList>

              {/* Corte 1 */}
              <TabsContent value="corte1">
                <Card>
                  <CardHeader>
                    <CardTitle>Corte 1 - Calificaciones (30%)</CardTitle>
                    <CardDescription>Haz clic en cada celda para editar. Las notas se guardan automáticamente.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table className="border-collapse">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 bg-muted border border-border font-bold text-center min-w-[180px]">
                              Estudiante
                            </TableHead>
                            {activities.filter(a => a.corte === 1).map(activity => (
                              <TableHead key={activity.id} className="border border-border text-center min-w-[100px] bg-muted">
                                <div className="flex items-center justify-center gap-2">
                                  <div>
                                    <div className="font-semibold">{activity.name}</div>
                                    <div className="text-xs font-normal text-muted-foreground">{activity.percentage}%</div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteActivity(activity.id)}
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    title={`Eliminar ${activity.name}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/20 font-bold">
                              Nota Corte 1
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map(student => {
                            const studentGrade = getGrade(student.grade);
                            return (
                              <TableRow key={student.id} className="hover:bg-muted/30">
                                <TableCell className="sticky left-0 bg-background border border-border font-medium">
                                  {student.student?.full_name}
                                </TableCell>
                                {activities.filter(a => a.corte === 1).map(activity => {
                                  const key = `${student.student_id}-${activity.id}`;
                                  const currentValue = editingGrades[key] !== undefined 
                                    ? editingGrades[key]
                                    : grades[student.student_id]?.[activity.id] || "";
                                  const isSaving = savingGrade === key;

                                  return (
                                    <TableCell key={activity.id} className="border border-border text-center p-0">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={currentValue}
                                        onChange={(e) => handleGradeChange(student.student_id, activity.id, e.target.value)}
                                        onBlur={() => updateGrade(student.student_id, activity.id)}
                                        disabled={isSaving}
                                        className={`w-full h-10 text-center border-0 rounded-none focus-visible:ring-2 focus-visible:ring-primary ${
                                          isSaving ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''
                                        }`}
                                        placeholder="--"
                                      />
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="border border-border text-center font-bold text-lg bg-primary/10">
                                  {studentGrade?.corte1 ? studentGrade.corte1.toFixed(1) : "--"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {students.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No hay estudiantes inscritos en este curso
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Corte 2 */}
              <TabsContent value="corte2">
                <Card>
                  <CardHeader>
                    <CardTitle>Corte 2 - Calificaciones (35%)</CardTitle>
                    <CardDescription>Haz clic en cada celda para editar. Las notas se guardan automáticamente.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table className="border-collapse">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 bg-muted border border-border font-bold text-center min-w-[180px]">
                              Estudiante
                            </TableHead>
                            {activities.filter(a => a.corte === 2).map(activity => (
                              <TableHead key={activity.id} className="border border-border text-center min-w-[100px] bg-muted">
                                <div className="flex items-center justify-center gap-2">
                                  <div>
                                    <div className="font-semibold">{activity.name}</div>
                                    <div className="text-xs font-normal text-muted-foreground">{activity.percentage}%</div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteActivity(activity.id)}
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    title={`Eliminar ${activity.name}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/20 font-bold">
                              Nota Corte 2
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map(student => {
                            const studentGrade = getGrade(student.grade);
                            return (
                              <TableRow key={student.id} className="hover:bg-muted/30">
                                <TableCell className="sticky left-0 bg-background border border-border font-medium">
                                  {student.student?.full_name}
                                </TableCell>
                                {activities.filter(a => a.corte === 2).map(activity => {
                                  const key = `${student.student_id}-${activity.id}`;
                                  const currentValue = editingGrades[key] !== undefined 
                                    ? editingGrades[key]
                                    : grades[student.student_id]?.[activity.id] || "";
                                  const isSaving = savingGrade === key;

                                  return (
                                    <TableCell key={activity.id} className="border border-border text-center p-0">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={currentValue}
                                        onChange={(e) => handleGradeChange(student.student_id, activity.id, e.target.value)}
                                        onBlur={() => updateGrade(student.student_id, activity.id)}
                                        disabled={isSaving}
                                        className={`w-full h-10 text-center border-0 rounded-none focus-visible:ring-2 focus-visible:ring-primary ${
                                          isSaving ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''
                                        }`}
                                        placeholder="--"
                                      />
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="border border-border text-center font-bold text-lg bg-primary/10">
                                  {studentGrade?.corte2 ? studentGrade.corte2.toFixed(1) : "--"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {students.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No hay estudiantes inscritos en este curso
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Corte 3 */}
              <TabsContent value="corte3">
                <Card>
                  <CardHeader>
                    <CardTitle>Corte 3 - Calificaciones (35%)</CardTitle>
                    <CardDescription>Haz clic en cada celda para editar. Las notas se guardan automáticamente.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table className="border-collapse">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 bg-muted border border-border font-bold text-center min-w-[180px]">
                              Estudiante
                            </TableHead>
                            {activities.filter(a => a.corte === 3).map(activity => (
                              <TableHead key={activity.id} className="border border-border text-center min-w-[100px] bg-muted">
                                <div className="flex items-center justify-center gap-2">
                                  <div>
                                    <div className="font-semibold">{activity.name}</div>
                                    <div className="text-xs font-normal text-muted-foreground">{activity.percentage}%</div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteActivity(activity.id)}
                                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    title={`Eliminar ${activity.name}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/20 font-bold">
                              Nota Corte 3
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map(student => {
                            const studentGrade = getGrade(student.grade);
                            return (
                              <TableRow key={student.id} className="hover:bg-muted/30">
                                <TableCell className="sticky left-0 bg-background border border-border font-medium">
                                  {student.student?.full_name}
                                </TableCell>
                                {activities.filter(a => a.corte === 3).map(activity => {
                                  const key = `${student.student_id}-${activity.id}`;
                                  const currentValue = editingGrades[key] !== undefined 
                                    ? editingGrades[key]
                                    : grades[student.student_id]?.[activity.id] || "";
                                  const isSaving = savingGrade === key;

                                  return (
                                    <TableCell key={activity.id} className="border border-border text-center p-0">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={currentValue}
                                        onChange={(e) => handleGradeChange(student.student_id, activity.id, e.target.value)}
                                        onBlur={() => updateGrade(student.student_id, activity.id)}
                                        disabled={isSaving}
                                        className={`w-full h-10 text-center border-0 rounded-none focus-visible:ring-2 focus-visible:ring-primary ${
                                          isSaving ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''
                                        }`}
                                        placeholder="--"
                                      />
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="border border-border text-center font-bold text-lg bg-primary/10">
                                  {studentGrade?.corte3 ? studentGrade.corte3.toFixed(1) : "--"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {students.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No hay estudiantes inscritos en este curso
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vista Total */}
              <TabsContent value="total">
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Total - Todas las Calificaciones</CardTitle>
                    <CardDescription>Vista completa con todas las actividades y notas finales. Haz clic en cada celda para editar.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table className="border-collapse">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 bg-muted border border-border font-bold text-center min-w-[180px]">
                              Estudiante
                            </TableHead>
                            {activities.map(activity => (
                              <TableHead key={activity.id} className="border border-border text-center min-w-[100px] bg-muted">
                                <div className="font-semibold">{activity.name}</div>
                                <div className="text-xs font-normal text-muted-foreground">
                                  Corte {activity.corte} • {activity.percentage}%
                                </div>
                              </TableHead>
                            ))}
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/10 font-bold">
                              Corte 1<br />
                              <span className="text-xs font-normal">(30%)</span>
                            </TableHead>
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/10 font-bold">
                              Corte 2<br />
                              <span className="text-xs font-normal">(35%)</span>
                            </TableHead>
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/10 font-bold">
                              Corte 3<br />
                              <span className="text-xs font-normal">(35%)</span>
                            </TableHead>
                            <TableHead className="border border-border text-center min-w-[100px] bg-primary/20 font-bold">
                              Nota Final
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map(student => {
                            const studentGrade = getGrade(student.grade);
                            return (
                              <TableRow key={student.id} className="hover:bg-muted/30">
                                <TableCell className="sticky left-0 bg-background border border-border font-medium">
                                  {student.student?.full_name}
                                </TableCell>
                                {activities.map(activity => {
                                  const key = `${student.student_id}-${activity.id}`;
                                  const currentValue = editingGrades[key] !== undefined 
                                    ? editingGrades[key]
                                    : grades[student.student_id]?.[activity.id] || "";
                                  const isSaving = savingGrade === key;

                                  return (
                                    <TableCell key={activity.id} className="border border-border text-center p-0">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={currentValue}
                                        onChange={(e) => handleGradeChange(student.student_id, activity.id, e.target.value)}
                                        onBlur={() => updateGrade(student.student_id, activity.id)}
                                        disabled={isSaving}
                                        className={`w-full h-10 text-center border-0 rounded-none focus-visible:ring-2 focus-visible:ring-primary ${
                                          isSaving ? 'bg-yellow-100 dark:bg-yellow-900/20' : ''
                                        }`}
                                        placeholder="--"
                                      />
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="border border-border text-center font-semibold bg-muted/30">
                                  {studentGrade?.corte1 ? studentGrade.corte1.toFixed(1) : "--"}
                                </TableCell>
                                <TableCell className="border border-border text-center font-semibold bg-muted/30">
                                  {studentGrade?.corte2 ? studentGrade.corte2.toFixed(1) : "--"}
                                </TableCell>
                                <TableCell className="border border-border text-center font-semibold bg-muted/30">
                                  {studentGrade?.corte3 ? studentGrade.corte3.toFixed(1) : "--"}
                                </TableCell>
                                <TableCell className="border border-border text-center font-bold text-lg bg-primary/10">
                                  {studentGrade?.final_grade ? studentGrade.final_grade.toFixed(1) : "--"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {students.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No hay estudiantes inscritos en este curso
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Control de Asistencia</CardTitle>
                <CardDescription>Selecciona una fecha y marca la asistencia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex flex-col gap-4">
                    <Label>Seleccionar Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Selecciona una fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button onClick={saveAllAttendance} className="gap-2">
                      <Save className="h-4 w-4" />
                      Guardar Asistencia
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead className="text-center">Presente ✅</TableHead>
                      <TableHead className="text-center">Ausente ❎</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => {
                      const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                      const dateAttendance = attendance[student.student_id]?.find((a: any) => a.date === dateStr);
                      const isPresent = dateAttendance?.present;

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.student?.full_name}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={isPresent === true ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleAttendance(student.student_id, dateStr)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={isPresent === false ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleAttendance(student.student_id, dateStr)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <div className="space-y-6">
              <CourseMaterialsUpload 
                courseId={courseId!} 
                onUploadComplete={() => setMaterialsRefresh(prev => prev + 1)}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Materiales del Curso</CardTitle>
                  <CardDescription>Archivos y recursos disponibles para los estudiantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <CourseMaterialsList 
                    courseId={courseId!} 
                    isTeacher={true}
                    refreshTrigger={materialsRefresh}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Estudiantes</CardTitle>
                <CardDescription>{students.length} estudiantes inscritos en el curso</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Corte 1</TableHead>
                      <TableHead className="text-center">Corte 2</TableHead>
                      <TableHead className="text-center">Corte 3</TableHead>
                      <TableHead className="text-center">Nota Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => {
                      const studentGrade = getGrade(student.grade);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{student.student?.full_name}</TableCell>
                          <TableCell>{student.student?.email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={studentGrade?.corte1 ? "default" : "secondary"}>
                              {studentGrade?.corte1 ? studentGrade.corte1.toFixed(1) : "--"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={studentGrade?.corte2 ? "default" : "secondary"}>
                              {studentGrade?.corte2 ? studentGrade.corte2.toFixed(1) : "--"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={studentGrade?.corte3 ? "default" : "secondary"}>
                              {studentGrade?.corte3 ? studentGrade.corte3.toFixed(1) : "--"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={studentGrade?.final_grade && studentGrade.final_grade >= 3 ? "default" : "destructive"}>
                              {studentGrade?.final_grade ? studentGrade.final_grade.toFixed(1) : "--"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {students.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No hay estudiantes inscritos en este curso
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseDetails;
