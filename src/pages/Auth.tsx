import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import logo from "@/assets/logo.png";
const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast.success("¡Bienvenido de vuelta!");
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error: signUpError
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      if (signUpError) throw signUpError;
      toast.success("¡Cuenta creada exitosamente! Puedes iniciar sesión ahora.");
    } catch (error: any) {
      toast.error(error.message || "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`
      });
      if (error) throw error;
      toast.success("¡Correo de recuperación enviado! Revisa tu bandeja de entrada.");
      setShowReset(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar correo de recuperación");
    } finally {
      setLoading(false);
    }
  };
  if (showReset) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent p-4">
        <Card className="w-full max-w-md animate-fade-in shadow-2xl border-none bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <Button variant="ghost" onClick={() => setShowReset(false)} className="w-fit -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
            <CardDescription>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <div className="absolute left-0 top-0 h-full w-12 bg-primary/20 rounded-l-md flex items-center justify-center border-r border-border">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <Input id="reset-email" type="email" placeholder="Correo electrónico" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className="pl-16 h-12" />
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent p-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" />
      
      <Card className="w-full max-w-md animate-fade-in shadow-2xl border-none bg-card/95 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-6 text-center pb-6">
          {/* User icon circle */}
          <div className="mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-lg opacity-50" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center border-3 border-background">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center">
                <img src={logo} alt="AcademiCo" className="max-h-10 w-auto animate-scale-in" />
              </div>
            </div>
            {/* Decorative line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[200%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />
          </div>
          
          <div>
            <CardTitle className="text-3xl font-bold">AcademiCo</CardTitle>
            <CardDescription className="text-base mt-2">Sistema de Gestión Académica</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="text-base">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup" className="text-base">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-0 top-0 h-full w-12 bg-primary/20 rounded-l-md flex items-center justify-center border-r border-border">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <Input id="signin-email" type="email" placeholder="CORREO ELECTRÓNICO" value={email} onChange={e => setEmail(e.target.value)} required className="pl-16 h-14 text-base uppercase placeholder:text-muted-foreground/50" />
                </div>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 h-full w-12 bg-primary/20 rounded-l-md flex items-center justify-center border-r border-border">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <Input id="signin-password" type="password" placeholder="CONTRASEÑA" value={password} onChange={e => setPassword(e.target.value)} required className="pl-16 h-14 text-base uppercase placeholder:text-muted-foreground/50" />
                </div>
                
                <Button type="submit" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg" disabled={loading}>
                  {loading ? "Cargando..." : "INICIAR SESIÓN"}
                </Button>
                
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-primary" />
                    <span className="text-muted-foreground">Recordarme</span>
                  </label>
                  <Button type="button" variant="link" onClick={() => setShowReset(true)} className="text-muted-foreground hover:text-primary p-0 h-auto">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-0 top-0 h-full w-12 bg-primary/20 rounded-l-md flex items-center justify-center border-r border-border">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <Input id="signup-name" type="text" placeholder="NOMBRE COMPLETO" value={fullName} onChange={e => setFullName(e.target.value)} required className="pl-16 h-14 text-base uppercase placeholder:text-muted-foreground/50" />
                </div>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 h-full w-12 bg-primary/20 rounded-l-md flex items-center justify-center border-r border-border">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <Input id="signup-email" type="email" placeholder="CORREO ELECTRÓNICO" value={email} onChange={e => setEmail(e.target.value)} required className="pl-16 h-14 text-base uppercase placeholder:text-muted-foreground/50" />
                </div>
                
                <div className="relative">
                  <div className="absolute left-0 top-0 h-full w-12 bg-primary/20 rounded-l-md flex items-center justify-center border-r border-border">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <Input id="signup-password" type="password" placeholder="CONTRASEÑA" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="pl-16 h-14 text-base uppercase placeholder:text-muted-foreground/50" />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base">Tipo de cuenta</Label>
                  <RadioGroup value={role} onValueChange={(value: "student" | "teacher") => setRole(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="font-normal cursor-pointer flex-1">Estudiante</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="font-normal cursor-pointer flex-1">Profesor</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button type="submit" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg" disabled={loading}>
                  {loading ? "Creando cuenta..." : "CREAR CUENTA"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;