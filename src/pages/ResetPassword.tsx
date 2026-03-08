import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="gradient-hero">
          <div className="container max-w-4xl mx-auto px-4 py-10 text-center">
            <div className="flex justify-center mb-3">
              <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm p-3">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl font-heading text-primary-foreground">
              Redefinir Senha
            </h1>
          </div>
        </header>
        <main className="flex-1 flex items-start justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-card border border-border p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </p>
            <Button variant="outline" onClick={() => navigate("/auth")} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-hero">
        <div className="container max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm p-3">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-heading text-primary-foreground">
            Nova Senha
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-card shadow-card border border-border p-8">
          <h2 className="text-xl font-heading text-foreground text-center mb-6">
            Defina sua nova senha
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Atualizar senha"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
