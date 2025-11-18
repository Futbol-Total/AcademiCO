import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  uploaded_by: string;
}

interface CourseMaterialsListProps {
  courseId: string;
  isTeacher: boolean;
  refreshTrigger?: number;
}

export const CourseMaterialsList = ({ courseId, isTeacher, refreshTrigger }: CourseMaterialsListProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, [courseId, refreshTrigger]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      console.error("Error fetching materials:", error);
      toast.error("Error al cargar los materiales");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(material.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Descarga iniciada");
    } catch (error: any) {
      console.error("Error downloading:", error);
      toast.error("Error al descargar el archivo");
    }
  };

  const handlePreview = async (material: Material) => {
    if (material.file_type !== 'pdf') {
      toast.error("Vista previa solo disponible para archivos PDF");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(material.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
      setPreviewTitle(material.title);
    } catch (error: any) {
      console.error("Error previewing:", error);
      toast.error("Error al previsualizar el archivo");
    }
  };

  const handleDelete = async (materialId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('course-materials')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', materialId);

      if (dbError) throw dbError;

      toast.success("Material eliminado exitosamente");
      fetchMaterials();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar el material");
    }
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-8 w-8 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando materiales...</p>
        </CardContent>
      </Card>
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No hay materiales disponibles {isTeacher ? "aún. ¡Sube el primer material!" : "en este curso."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <Card key={material.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getFileIcon(material.file_type)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{material.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {format(new Date(material.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">{material.file_type.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {material.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{material.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{material.file_name}</span>
                <span>•</span>
                <span>{formatFileSize(material.file_size)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(material)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                {material.file_type === 'pdf' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(material)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {isTeacher && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(material.id, material.file_path)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-md"
              title="Vista previa del PDF"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
