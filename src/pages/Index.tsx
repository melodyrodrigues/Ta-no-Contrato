import { useState, useCallback } from "react";
import { FileSearch, AlertTriangle, History, LogIn, LogOut, Sparkles, Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ContractUpload from "@/components/ContractUpload";
import AnalysisResult from "@/components/AnalysisResult";
import { Button } from "@/components/ui/button";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-contract`;

const FEATURES = [
  { icon: FileSearch, title: "Análise Completa", desc: "Resumo detalhado, cláusulas e checklist de verificação", delay: "0ms" },
  { icon: AlertTriangle, title: "Alertas de Risco", desc: "Identifica multas, juros abusivos e pegadinhas contratuais", delay: "120ms" },
  { icon: Shield, title: "Linguagem Simples", desc: "Tudo explicado sem juridiquês, fácil de entender", delay: "240ms" },
];

const Index = () => {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastContractText, setLastContractText] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const saveAnalysis = useCallback(async (contractText: string, result: string) => {
    if (!user) return;
    const firstLine = result.split("\n").find((l) => l.trim().length > 0) || "";
    const title = firstLine.replace(/^#+\s*/, "").replace(/📄|📝|✅|⚠️|📌|❓|✔️|⚖️/g, "").trim().slice(0, 100) || "Contrato analisado";

    const { error } = await supabase.from("contract_analyses").insert({
      user_id: user.id,
      title,
      contract_text: contractText,
      analysis_result: result,
    });

    if (error) {
      console.error("Error saving analysis:", error);
    } else {
      toast.success("Análise salva no histórico!");
    }
  }, [user]);

  const handleAnalyze = useCallback(async (text: string) => {
    setIsLoading(true);
    setAnalysis("");
    setShowResult(true);
    setLastContractText(text);

    try {
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ contractText: text }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast.error(err.error || "Erro ao analisar contrato");
        setIsLoading(false);
        setShowResult(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao conectar com o servidor de análise.");
      setShowResult(false);
    } finally {
      setIsLoading(false);
    }
  }, [saveAnalysis]);

  const handleNewAnalysis = () => {
    setAnalysis("");
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="gradient-hero">
        <div className="container max-w-5xl mx-auto px-6 pt-14 pb-20 md:pt-16 md:pb-24 text-center relative z-10">
          {/* Auth button */}
          <div className="absolute top-5 right-5 md:top-6 md:right-6">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8 rounded-full px-4 text-sm font-medium backdrop-blur-sm"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sair
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-8 text-2xl font-bold backdrop-blur-sm h-14"
              >
                <LogIn className="mr-3 h-6 w-6" />
                Entrar
              </Button>
            )}
          </div>

          <div className="flex justify-center mb-5 animate-float">
            <img src={logo} alt="Tá no Contrato logo" className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading text-primary-foreground mb-3 tracking-tight text-balance">
            Tá no Contrato
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/40 font-body italic mb-5 tracking-wide">
            O que ninguém te explica, mas tá no contrato.
          </p>
          <p className="text-lg md:text-xl text-primary-foreground/65 max-w-2xl mx-auto font-body leading-relaxed text-balance">
            Cole ou envie o texto do seu contrato e receba uma explicação clara,
            com alertas e pontos de atenção — tudo em linguagem simples.
          </p>
          <div className="flex items-center justify-center gap-2.5 mt-6">
            <Sparkles className="h-3.5 w-3.5 text-secondary/80" />
            <span className="text-xs text-primary-foreground/40 font-medium tracking-widest uppercase">Análise com Inteligência Artificial</span>
          </div>
        </div>
      </header>

      {/* Feature Cards */}
      {!showResult && (
        <section className="container max-w-5xl mx-auto px-6 -mt-14 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, delay }) => (
              <div
                key={title}
                className="group rounded-2xl bg-card shadow-premium border border-border/50 p-7 text-center hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-500 ease-out animate-fade-in-up"
                style={{ animationDelay: delay }}
              >
                <div className="feature-icon-bg rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
            <div
              className="group rounded-2xl bg-card shadow-premium border border-border/50 p-7 text-center cursor-pointer hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-500 ease-out animate-fade-in-up"
              style={{ animationDelay: "360ms" }}
              onClick={() => {
                if (!user) {
                  toast.info("Faça login para acessar seu histórico.");
                  navigate("/auth");
                  return;
                }
                navigate("/historico");
              }}
            >
              <div className="feature-icon-bg rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                <History className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1.5">Histórico</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Análises salvas</p>
              <p className="text-sm text-primary font-semibold mt-3 group-hover:underline">Acessar →</p>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-6 py-16 md:py-20">
        {showResult ? (
          <AnalysisResult
            content={analysis}
            isStreaming={isLoading}
            onNewAnalysis={handleNewAnalysis}
            onSaveHistory={async () => {
              if (!user) {
                toast.info("Faça login para salvar suas análises.");
                navigate("/auth");
                return;
              }
              await saveAnalysis(lastContractText, analysis);
              navigate("/historico");
            }}
          />
        ) : (
          <ContractUpload onAnalyze={handleAnalyze} isLoading={isLoading} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-10 text-center">
        <div className="premium-divider max-w-xs mx-auto mb-8" />
        <p className="text-xs text-muted-foreground/50 tracking-wide">
          Esta ferramenta é informativa e não substitui orientação jurídica profissional.
        </p>
      </footer>
    </div>
  );
};

export default Index;
