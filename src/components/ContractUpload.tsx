import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const EXTRACT_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-text-from-image`;

interface ContractUploadProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

async function extractPdfTextNative(file: File): Promise<string> {
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

async function extractPdfViaOCR(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const resp = await fetch(EXTRACT_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ imageBase64: base64, mimeType: "application/pdf" }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro ao extrair texto do PDF via OCR");
  }

  const data = await resp.json();
  return data.text;
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const text = await extractPdfTextNative(file);
    if (text.trim().length > 50) return text;
  } catch (e) {
    console.log("Native PDF extraction failed, falling back to OCR:", e);
  }
  console.log("PDF appears to be scanned, using OCR...");
  return await extractPdfViaOCR(file);
}

async function extractImageText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const resp = await fetch(EXTRACT_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || "Erro ao extrair texto da imagem");
  }

  const data = await resp.json();
  return data.text;
}

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const ContractUpload = ({ onAnalyze, isLoading }: ContractUploadProps) => {
  const { user } = useAuth();
  const [contractText, setContractText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setExtracting(true);
      try {
        const text = await extractPdfText(file);
        if (text.trim().length === 0) {
          toast.error("Não foi possível extrair texto do PDF.");
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
    } else if (IMAGE_TYPES.includes(file.type)) {
      setExtracting(true);
      try {
        const text = await extractImageText(file);
        setContractText(text);
        toast.success(`Texto extraído da imagem: ${file.name}`);
      } catch (err: any) {
        console.error("Image extraction error:", err);
        toast.error(err.message || "Erro ao extrair texto da imagem.");
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
      toast.error("Formato não suportado. Use .pdf, .txt ou imagem (.jpg, .png, .webp)");
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

  const canAnalyze = contractText.trim().length >= 20;
  const hasText = contractText.trim().length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 animate-fade-in">
      {/* Drop Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed p-12 md:p-16 text-center transition-all duration-500 ease-out ${
          dragActive
            ? "border-primary bg-primary/5 scale-[1.01] shadow-card-hover"
            : "border-border/70 hover:border-primary/25 hover:bg-muted/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-5">
          <div className={`rounded-2xl p-5 transition-all duration-500 ease-out ${
            dragActive ? "bg-primary/12 scale-110" : "feature-icon-bg"
          }`}>
            {extracting ? (
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            ) : (
              <Upload className="h-7 w-7 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {extracting ? "Extraindo texto do documento..." : "Arraste um arquivo aqui"}
            </p>
            <p className="text-sm text-muted-foreground/70">
              ou clique para selecionar um arquivo do seu computador
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/60 rounded-full px-3 py-1.5 font-medium">
              <FileText className="h-3 w-3" />
              PDF
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/60 rounded-full px-3 py-1.5 font-medium">
              <FileText className="h-3 w-3" />
              TXT
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/60 rounded-full px-3 py-1.5 font-medium">
              <Image className="h-3 w-3" />
              JPG / PNG
            </div>
          </div>
          <input
            type="file"
            accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={extracting}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-5">
        <div className="flex-1 premium-divider" />
        <span className="text-xs text-muted-foreground/50 font-medium uppercase tracking-[0.2em]">ou cole o texto</span>
        <div className="flex-1 premium-divider" />
      </div>

      {/* Textarea */}
      <Textarea
        value={contractText}
        onChange={(e) => setContractText(e.target.value)}
        placeholder="Cole aqui o texto do contrato que você deseja analisar..."
        className="min-h-[200px] resize-y rounded-2xl border-border/60 bg-card text-base leading-relaxed font-body placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all duration-300 p-5"
      />

      {/* Analyze Button */}
      <Button
        onClick={() => onAnalyze(contractText)}
        disabled={isLoading || extracting || !canAnalyze}
        className="w-full h-14 rounded-2xl text-base font-semibold bg-primary text-white hover:bg-primary/90 transition-all duration-500 ease-out hover:shadow-card-hover disabled:opacity-30"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2.5 h-5 w-5 animate-spin" />
            Analisando contrato...
          </>
        ) : (
          <>
            <FileText className="mr-2.5 h-5 w-5" />
            Analisar Contrato
          </>
        )}
      </Button>

      {/* Validation hint */}
      {hasText && !canAnalyze && (
        <p className="text-sm text-warning text-center animate-fade-in">
          O texto precisa ter pelo menos 20 caracteres para análise.
        </p>
      )}
    </div>
  );
};

export default ContractUpload;
