import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentCourseCardProps {
  enrollment: any;
}

const StudentCourseCard = ({ enrollment }: StudentCourseCardProps) => {
  const navigate = useNavigate();
  const course = enrollment.course;
  const grade = Array.isArray(enrollment.grade) ? enrollment.grade[0] : enrollment.grade;
  const teacher = course.teacher;

  const getGradeColor = (grade: number | null) => {
    if (!grade) return "secondary";
    if (grade >= 4.0) return "default";
    if (grade >= 3.0) return "secondary";
    return "destructive";
  };

  // Preparar datos para el gráfico
  const chartData = [];
  if (grade?.corte1) chartData.push({ corte: "Corte 1", nota: grade.corte1 });
  if (grade?.corte2) chartData.push({ corte: "Corte 2", nota: grade.corte2 });
  if (grade?.corte3) chartData.push({ corte: "Corte 3", nota: grade.corte3 });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{course.name}</CardTitle>
            <CardDescription className="mt-1">{course.code}</CardDescription>
          </div>
          <Badge variant="secondary">{course.academic_period}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{teacher?.full_name || "Profesor"}</span>
        </div>

        {grade && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Corte 1</span>
                <Badge variant={getGradeColor(grade.corte1)}>
                  {grade.corte1 ? grade.corte1.toFixed(1) : "--"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Corte 2</span>
                <Badge variant={getGradeColor(grade.corte2)}>
                  {grade.corte2 ? grade.corte2.toFixed(1) : "--"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Corte 3</span>
                <Badge variant={getGradeColor(grade.corte3)}>
                  {grade.corte3 ? grade.corte3.toFixed(1) : "--"}
                </Badge>
              </div>
              {grade.final_grade && (
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Nota Final</span>
                  </div>
                  <Badge variant={getGradeColor(grade.final_grade)} className="text-base">
                    {grade.final_grade.toFixed(1)}
                  </Badge>
                </div>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Progreso de Notas</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="corte" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="nota" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => navigate(`/course/${course.id}`)}
        >
          Ver Detalles
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudentCourseCard;
