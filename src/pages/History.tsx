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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero">
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur-sm p-3">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-heading text-primary-foreground">
            Histórico de Análises
          </h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="mb-6 rounded-xl border-border hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {selected ? (
          <div>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              className="mb-4 rounded-xl border-border hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao histórico
            </Button>
            <AnalysisResult
              content={selected.analysis_result}
              isStreaming={false}
              onNewAnalysis={() => setSelected(null)}
            />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhuma análise salva ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analise um contrato para que ele apareça aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-card shadow-card border border-border p-5 flex items-center justify-between gap-4 hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => setSelected(item)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
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
                  className="text-muted-foreground hover:text-destructive shrink-0"
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
