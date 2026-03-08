import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um assistente especializado em explicar contratos em linguagem simples para pessoas leigas.

Analise o texto do contrato enviado e responda em português do Brasil, em linguagem simples, com clareza e objetividade.

Sua resposta deve seguir EXATAMENTE esta estrutura com os títulos em markdown:

## 📄 1. Tipo do contrato
(Identifique o tipo: imobiliário, bancário, prestação de serviços, compra e venda, escolar, etc. Explique de forma detalhada o que é esse tipo de contrato, para que serve, em quais situações ele é usado, quais são as partes envolvidas e qual a finalidade principal desse documento. Dê contexto para que o leitor entenda a importância e o propósito desse tipo de acordo.)

## 📝 2. Resumo simples
(Explique em poucas frases o que o contrato faz, como se estivesse explicando para alguém sem conhecimento jurídico)

## ✅ 3. O que você está aceitando
(Liste em tópicos os principais compromissos e obrigações que a pessoa assume ao assinar)

## ⚠️ 4. Pontos de atenção
(Destaque itens que merecem cuidado especial: multas, reajustes, juros, prazos, rescisão, renovação automática, foro, garantias, encargos e responsabilidades)

## 📌 5. Cláusulas importantes
(Liste e explique as cláusulas mais relevantes em linguagem acessível)

## ❓ 6. Perguntas que vale fazer antes de assinar
(Sugira perguntas práticas que a pessoa deveria fazer ao outro lado antes de assinar)

## ✔️ 7. Checklist final
(Uma lista de verificação rápida antes de assinar)

## ⚖️ 8. Aviso legal
"Esta análise é informativa e não substitui orientação jurídica profissional. Para decisões importantes, consulte um advogado."

Regras:
- Não dê parecer jurídico definitivo
- Não diga que o contrato é legal ou ilegal de forma categórica
- Use linguagem simples e acessível
- Destaque multa, reajuste, juros, prazo, rescisão, renovação automática, foro, garantias, encargos e responsabilidades
- A resposta deve ser útil para tomada de decisão`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractText } = await req.json();

    if (!contractText || contractText.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Texto do contrato muito curto ou vazio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analise o seguinte contrato:\n\n${contractText}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao analisar o contrato." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-contract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
