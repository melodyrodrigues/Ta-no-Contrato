import { useRef, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, Download, Loader2, BookmarkPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AnalysisResultProps {
  content: string;
  isStreaming: boolean;
  onNewAnalysis: () => void;
  onSaveHistory: () => Promise<void>;
}

const AnalysisResult = ({ content, isStreaming, onNewAnalysis, onSaveHistory }: AnalysisResultProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: "analise-contrato.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(contentRef.current).save();
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExporting(false);
    }
  }, []);

  const handleSaveHistory = useCallback(async () => {
    setSaving(true);
    try {
      await onSaveHistory();
    } catch (err) {
      console.error("Save history error:", err);
    } finally {
      setSaving(false);
    }
  }, [onSaveHistory]);

  return (
    <div className="w-full max-w-3xl mx-auto animate-scale-in">
      <div className="rounded-2xl bg-card shadow-premium overflow-hidden">
        {/* Header */}
        <div className="gradient-hero px-7 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            {isStreaming ? (
              <div className="h-2 w-2 rounded-full bg-secondary animate-pulse-soft" />
            ) : (
              <CheckCircle className="h-4.5 w-4.5 text-primary-foreground/70" />
            )}
            <h2 className="text-lg md:text-xl font-heading text-primary-foreground tracking-tight">
              {isStreaming ? "Analisando..." : "Resultado da Análise"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!isStreaming && content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPdf}
                disabled={exporting}
                className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/8 rounded-full text-xs font-medium"
              >
                {exporting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Exportar
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[60vh]">
          <div ref={contentRef} className="p-7 md:p-10 lg:p-12">
            <div className="prose prose-sm md:prose-base max-w-none
              prose-headings:font-heading prose-headings:text-foreground prose-headings:tracking-tight
              prose-h2:text-lg prose-h2:md:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/50
              prose-p:text-foreground/75 prose-p:leading-[1.8]
              prose-li:text-foreground/75 prose-li:leading-[1.7]
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:space-y-2
              first:prose-h2:mt-0
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            {isStreaming && (
              <span className="inline-block w-1.5 h-5 bg-primary/60 rounded-sm animate-pulse-soft ml-0.5" />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      {!isStreaming && content && (
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3.5 animate-fade-in-up">
          <Button
            onClick={handleSaveHistory}
            disabled={saving}
            className="rounded-2xl h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-card-hover transition-all duration-500 ease-out text-sm font-semibold"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BookmarkPlus className="mr-2 h-4 w-4" />
            )}
            Salvar no Histórico
          </Button>
          <Button
            onClick={onNewAnalysis}
            variant="outline"
            className="rounded-2xl h-12 px-8 border-border/60 hover:bg-muted/50 transition-all duration-500 ease-out text-sm font-medium"
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Analisar outro contrato
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisResult;
