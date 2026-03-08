import { useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, Download, Loader2, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface AnalysisResultProps {
  content: string;
  isStreaming: boolean;
  onNewAnalysis: () => void;
  onSaveHistory: () => Promise<void>;
  contractText: string;
}

const AnalysisResult = ({ content, isStreaming, onNewAnalysis, onSaveHistory, contractText }: AnalysisResultProps) => {
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
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
        <div className="gradient-hero px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-heading text-primary-foreground">
            Resultado da Análise
          </h2>
          <div className="flex items-center gap-3">
            {isStreaming && (
              <span className="text-sm text-primary-foreground/80 animate-pulse-soft">
                Analisando...
              </span>
            )}
            {!isStreaming && content && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPdf}
                disabled={exporting}
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                {exporting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                Exportar PDF
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[60vh]">
          <div ref={contentRef} className="p-6 md:p-8">
            <div className="prose prose-sm md:prose-base max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
              prose-p:text-foreground/85 prose-p:leading-relaxed
              prose-li:text-foreground/85
              prose-strong:text-foreground
              prose-ul:space-y-1
              first:prose-h2:mt-0
            ">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary animate-pulse-soft ml-1" />
            )}
          </div>
        </ScrollArea>
      </div>

      {!isStreaming && content && (
        <div className="mt-6 flex justify-center gap-3">
          <Button
            onClick={onNewAnalysis}
            variant="outline"
            className="rounded-xl border-border hover:bg-muted"
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
