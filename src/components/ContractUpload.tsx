import { useState, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ContractUploadProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

const ContractUpload = ({ onAnalyze, isLoading }: ContractUploadProps) => {
  const [contractText, setContractText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setExtracting(true);
      try {
        const text = await extractPdfText(file);
        if (text.trim().length === 0) {
          toast.error("Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.");
          return;
        }
        setContractText(text);
        toast.success(`PDF carregado: ${file.name}`);
      } catch (err) {
        console.error("PDF extraction error:", err);
        toast.error("Erro ao ler o PDF. Tente outro arquivo.");
      } finally {
        setExtracting(false);
      }
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) setContractText(text);
      };
      reader.readAsText(file);
    } else {
      toast.error("Formato não suportado. Use .pdf ou .txt");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary/10 p-4">
            {extracting ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {extracting ? "Extraindo texto do PDF..." : "Arraste um arquivo aqui"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar (.pdf ou .txt)
            </p>
          </div>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={extracting}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground font-medium">ou cole o texto abaixo</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Textarea
        value={contractText}
        onChange={(e) => setContractText(e.target.value)}
        placeholder="Cole aqui o texto do contrato que você deseja analisar..."
        className="min-h-[200px] resize-y rounded-xl border-border bg-card text-base leading-relaxed font-body placeholder:text-muted-foreground/60"
      />

      <Button
        onClick={() => onAnalyze(contractText)}
        disabled={isLoading || extracting || contractText.trim().length < 20}
        className="w-full h-14 rounded-xl text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analisando contrato...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-5 w-5" />
            Analisar Contrato
          </>
        )}
      </Button>

      {contractText.trim().length > 0 && contractText.trim().length < 20 && (
        <p className="text-sm text-warning text-center">
          O texto precisa ter pelo menos 20 caracteres para análise.
        </p>
      )}
    </div>
  );
};

export default ContractUpload;
