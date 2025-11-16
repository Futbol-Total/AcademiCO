import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Upload, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
const Profile = () => {
  const navigate = useNavigate();
  const {
    theme,
    setTheme
  } = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  useEffect(() => {
    getProfile();
  }, []);
  const getProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const {
        data,
        error
      } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      setProfile(data);
      setFullName(data.full_name || "");
      setAvatarUrl(data.avatar_url || "");
    } catch (error: any) {
      toast.error("Error al cargar perfil");
    }
  };
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      const {
        error
      } = await supabase.from("profiles").update({
        full_name: fullName,
        avatar_url: avatarUrl
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("¡Perfil actualizado!");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar perfil");
    } finally {
      setLoading(false);
    }
  };
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen");
      }
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      const {
        error: updateError
      } = await supabase.from("profiles").update({
        avatar_url: data.publicUrl
      }).eq("id", user.id);
      if (updateError) throw updateError;
      toast.success("¡Foto de perfil actualizada!");
    } catch (error: any) {
      toast.error(error.message || "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">Volver<ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>
              Administra tu información personal y preferencias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl">
                  {fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" id="avatar-upload" />
                <Label htmlFor="avatar-upload">
                  <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById("avatar-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Subiendo..." : "Cambiar Foto"}
                  </Button>
                </Label>
              </div>
            </div>

            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input id="role" value={profile?.role || ""} disabled className="bg-muted" />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Cambia entre modo claro y oscuro
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Profile;