import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface CourseMaterialsUploadProps {
  courseId: string;
  onUploadComplete: () => void;
}

export const CourseMaterialsUpload = ({ courseId, onUploadComplete }: CourseMaterialsUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('course_materials')
        .insert({
          course_id: courseId,
          title,
          description,
          file_name: file.name,
          file_path: fileName,
          file_type: fileExt || 'unknown',
          file_size: file.size,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast.success("Material subido exitosamente");
      setTitle("");
      setDescription("");
      setFile(null);
      onUploadComplete();
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error(error.message || "Error al subir el material");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Material del Curso</CardTitle>
        <CardDescription>Sube PDFs, videos, documentos y otros materiales para tus estudiantes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            placeholder="Ej: Presentación Clase 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            placeholder="Descripción del material (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="file">Archivo *</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mp3,.zip,.rar"
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
        <Button onClick={handleUpload} disabled={uploading || !file || !title} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Subiendo..." : "Subir Material"}
        </Button>
      </CardContent>
    </Card>
  );
};
