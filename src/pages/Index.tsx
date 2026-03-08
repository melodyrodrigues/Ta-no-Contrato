import { useState, useCallback } from "react";
import { Shield, FileSearch, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ContractUpload from "@/components/ContractUpload";
import AnalysisResult from "@/components/AnalysisResult";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-contract`;

const Index = () => {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalyze = useCallback(async (text: string) => {
    setIsLoading(true);
    setAnalysis("");
    setShowResult(true);

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
  }, []);

  const handleNewAnalysis = () => {
    setAnalysis("");
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero">
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm p-3">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading text-primary-foreground mb-4">
            Entenda seu Contrato
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto font-body">
            Cole ou envie o texto do seu contrato e receba uma explicação clara,
            com alertas e pontos de atenção — tudo em linguagem simples.
          </p>
        </div>
      </header>

      {/* Features */}
      {!showResult && (
        <section className="container max-w-4xl mx-auto px-4 -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: FileSearch, title: "Análise Completa", desc: "Resumo, cláusulas e checklist" },
              { icon: AlertTriangle, title: "Alertas de Risco", desc: "Multas, juros e pegadinhas" },
              { icon: Shield, title: "Linguagem Simples", desc: "Sem juridiquês complicado" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-card shadow-card border border-border p-5 text-center">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-10">
        {showResult ? (
          <AnalysisResult
            content={analysis}
            isStreaming={isLoading}
            onNewAnalysis={handleNewAnalysis}
          />
        ) : (
          <ContractUpload onAnalyze={handleAnalyze} isLoading={isLoading} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Esta ferramenta é informativa e não substitui orientação jurídica profissional.
        </p>
      </footer>
    </div>
  );
};

export default Index;
