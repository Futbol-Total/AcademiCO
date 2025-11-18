import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EnrollCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  studentId: string;
}

const EnrollCourseDialog = ({ open, onOpenChange, onSuccess, studentId }: EnrollCourseDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find course by access code
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("access_code", accessCode.toUpperCase())
        .single();

      if (courseError || !course) {
        throw new Error("Código de acceso inválido");
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", course.id)
        .single();

      if (existingEnrollment) {
        throw new Error("Ya estás inscrito en este curso");
      }

      // Get student name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", studentId)
        .single();

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          student_id: studentId,
          course_id: course.id,
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // Create grade entry
      const { error: gradeError } = await supabase
        .from("grades")
        .insert({
          student_id: studentId,
          course_id: course.id,
          enrollment_id: enrollment.id,
          student_name: profile?.full_name || "Estudiante",
        });

      if (gradeError) throw gradeError;

      toast.success(`¡Inscrito exitosamente en ${course.name}!`);
      onOpenChange(false);
      onSuccess();
      setAccessCode("");
    } catch (error: any) {
      toast.error(error.message || "Error al inscribirse en el curso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inscribir Curso</DialogTitle>
          <DialogDescription>Ingresa el código de acceso del curso</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_code">Código de acceso</Label>
            <Input
              id="access_code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="ej. ABC123"
              required
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Solicita el código de acceso a tu profesor
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Inscribiendo..." : "Inscribir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollCourseDialog;
