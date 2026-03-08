import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ArrowLeft, Trash2, FileText, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import AnalysisResult from "@/components/AnalysisResult";
import { toast } from "sonner";

interface AnalysisRecord {
  id: string;
  title: string;
  created_at: string;
  analysis_result: string;
  contract_text: string;
}

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchAnalyses = async () => {
      const { data, error } = await supabase
        .from("contract_analyses")
        .select("id, title, created_at, analysis_result, contract_text")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar histórico");
        console.error(error);
      } else {
        setAnalyses(data || []);
      }
      setLoading(false);
    };
    fetchAnalyses();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contract_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir análise");
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Análise excluída");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero">
        <div className="container max-w-5xl mx-auto px-6 py-12 md:py-14 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-primary-foreground/8 backdrop-blur-md p-3.5 ring-1 ring-primary-foreground/10">
              <Shield className="h-7 w-7 text-primary-foreground/90" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-heading text-primary-foreground tracking-tight">
            Histórico de Análises
          </h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-10 md:py-12">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-8 rounded-xl border-border/50 hover:bg-muted/40 text-sm font-medium transition-all duration-300"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Voltar
        </Button>

        {selected ? (
          <div>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="mb-6 rounded-xl border-border/50 hover:bg-muted/40 text-sm font-medium transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Voltar ao histórico
            </Button>
            <AnalysisResult
              content={selected.analysis_result}
              isStreaming={false}
              onNewAnalysis={() => setSelected(null)}
              onSaveHistory={async () => {
                toast.success("Esta análise já foi salva!");
              }}
            />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-24">
            <div className="feature-icon-bg rounded-2xl p-5 w-16 h-16 mx-auto mb-5 flex items-center justify-center">
              <FileText className="h-7 w-7 text-primary/60" />
            </div>
            <p className="text-lg font-heading text-foreground/80">Nenhuma análise salva ainda.</p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Analise um contrato para que ele apareça aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {analyses.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-card shadow-premium border border-border/40 p-6 flex items-center justify-between gap-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-500 ease-out cursor-pointer group"
                onClick={() => setSelected(item)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(item.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground/30 hover:text-destructive shrink-0 rounded-xl transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
