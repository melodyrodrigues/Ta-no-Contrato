import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Link de recuperação enviado! Verifique seu e-mail.");
      setMode("login");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar link");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-hero">
        <div className="container max-w-5xl mx-auto px-6 py-14 md:py-16 text-center relative z-10">
          {/* Botão Voltar */}
          <div className="absolute top-5 left-5 md:top-6 md:left-6">
            <Button
              variant="ghost"
              size="default"
              onClick={() => navigate("/")}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-5 text-base font-semibold backdrop-blur-sm"
            >
              ← Voltar
            </Button>
          </div>

          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-primary-foreground/8 backdrop-blur-md p-3.5 ring-1 ring-primary-foreground/10">
              <Shield className="h-7 w-7 text-primary-foreground/90" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-heading text-primary-foreground tracking-tight">
            Tá no Contrato
          </h1>
          <p className="text-sm text-primary-foreground/35 mt-2 italic">
            O que ninguém te explica, mas tá no contrato.
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-12 md:py-16">
        <div className="w-full max-w-md rounded-2xl bg-card shadow-premium border border-border/40 p-8 md:p-10">
          <h2 className="text-xl font-heading text-foreground text-center mb-8 tracking-tight">
            {mode === "forgot" ? "Recuperar senha" : mode === "login" ? "Entrar na sua conta" : "Criar uma conta"}
          </h2>

          {mode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-sm text-muted-foreground/70 text-center leading-relaxed">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              <div className="space-y-2.5">
                <Label htmlFor="reset-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-11 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" && (
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-11 h-11 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-11 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-11 rounded-xl border-border/60 bg-background/50 focus:bg-background transition-colors"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {mode === "login" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary/70 hover:text-primary transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "login" ? (
                    "Entrar"
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>

              <div className="relative my-8">
                <div className="premium-divider w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-3 text-xs uppercase text-muted-foreground/40 tracking-[0.15em]">ou continue com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl text-sm font-medium border-border/50 hover:bg-muted/40 transition-all duration-300"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast.error("Erro ao entrar com Google");
                }}
              >
                <svg className="mr-2.5 h-4.5 w-4.5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
              </Button>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {mode === "login" ? "Não tem conta? Criar uma conta" : "Já tem conta? Entrar"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
