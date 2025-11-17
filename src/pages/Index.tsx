import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <img src={logo} alt="AcademiCo" className="max-h-20 w-auto " />
            <h1 className="text-2xl font-bold">
          </h1>
          </div>
          <Button onClick={() => navigate("/auth")} className="animate-fade-in">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AcademiCo
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema integral de gestión académica para profesores y estudiantes. 
              Organiza tus cursos, calificaciones y materiales educativos en una sola plataforma.
            </p>
            <p className="text-sm text-muted-foreground/80">
              Desarrollado por Oscar Vega
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 animate-scale-in">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Comenzar Ahora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Registrarse
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="space-y-3 animate-fade-in hover-scale">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Gestión de Cursos</h3>
              <p className="text-muted-foreground">
                Crea y administra cursos fácilmente con códigos de acceso únicos
              </p>
            </div>
            <div className="space-y-3 animate-fade-in hover-scale">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Control de Estudiantes</h3>
              <p className="text-muted-foreground">
                Administra inscripciones y seguimiento de estudiantes en tiempo real
              </p>
            </div>
            <div className="space-y-3 animate-fade-in hover-scale">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Sistema de Calificaciones</h3>
              <p className="text-muted-foreground">
                Gestiona calificaciones por cortes y calcula promedios automáticamente
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;