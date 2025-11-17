import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  course: any;
  onUpdate: () => void;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const enrollmentCount = course.enrollments?.[0]?.count || 0;

  const copyAccessCode = () => {
    navigator.clipboard.writeText(course.access_code);
    setCopied(true);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{enrollmentCount} estudiantes</span>
        </div>

        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Código de acceso</p>
            <p className="font-mono font-semibold">{course.access_code}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyAccessCode}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

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

export default CourseCard;
