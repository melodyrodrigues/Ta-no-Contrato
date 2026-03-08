import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalysisResultProps {
  content: string;
  isStreaming: boolean;
  onNewAnalysis: () => void;
}

const AnalysisResult = ({ content, isStreaming, onNewAnalysis }: AnalysisResultProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
        <div className="gradient-hero px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-heading text-primary-foreground">
            Resultado da Análise
          </h2>
          {isStreaming && (
            <span className="text-sm text-primary-foreground/80 animate-pulse-soft">
              Analisando...
            </span>
          )}
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="p-6 md:p-8">
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
        <div className="mt-6 text-center">
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
