import { useState, useCallback } from "react";
import { Shield, FileSearch, AlertTriangle, History, LogIn, LogOut, Sparkles } from "lucide-react";
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
  { icon: AlertTriangle, title: "Alertas de Risco", desc: "Identifica multas, juros abusivos e pegadinhas contratuais", delay: "100ms" },
  { icon: Shield, title: "Linguagem Simples", desc: "Tudo explicado sem juridiquês, fácil de entender", delay: "200ms" },
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
        <div className="container max-w-4xl mx-auto px-4 py-14 md:py-24 text-center relative z-10">
          {/* Auth button */}
          <div className="absolute top-4 right-4">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-4"
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sair
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-4"
              >
                <LogIn className="mr-1.5 h-4 w-4" />
                Entrar
              </Button>
            )}
          </div>

          <div className="flex justify-center mb-5 animate-float">
            <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-md p-4 ring-1 ring-primary-foreground/20">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading text-primary-foreground mb-5 tracking-tight">
            Entenda seu Contrato
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/75 max-w-2xl mx-auto font-body leading-relaxed">
            Cole ou envie o texto do seu contrato e receba uma explicação clara,
            com alertas e pontos de atenção — tudo em linguagem simples.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm text-primary-foreground/60 font-medium">Análise com Inteligência Artificial</span>
          </div>
        </div>
      </header>

      {/* Feature Cards */}
      {!showResult && (
        <section className="container max-w-4xl mx-auto px-4 -mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, delay }) => (
              <div
                key={title}
                className="group rounded-2xl bg-card shadow-card border border-border p-6 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: delay }}
              >
                <div className="feature-icon-bg rounded-xl p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
            {user && (
              <div
                className="group rounded-2xl bg-card shadow-card border border-border p-6 text-center cursor-pointer hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: "300ms" }}
                onClick={() => navigate("/historico")}
              >
                <div className="feature-icon-bg rounded-xl p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Histórico</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Análises salvas</p>
                <p className="text-xs text-primary font-semibold mt-2 group-hover:underline">Clique aqui para acessar →</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        {showResult ? (
          <AnalysisResult
            content={analysis}
            isStreaming={isLoading}
            onNewAnalysis={handleNewAnalysis}
            onSaveHistory={async () => {
              await saveAnalysis(lastContractText, analysis);
              navigate("/historico");
            }}
          />
        ) : (
          <ContractUpload onAnalyze={handleAnalyze} isLoading={isLoading} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground/70">
          Esta ferramenta é informativa e não substitui orientação jurídica profissional.
        </p>
      </footer>
    </div>
  );
};

export default Index;
