// Ser Dono — Edge Function "cotacoes" (Módulo Mentoria em Investimentos,
// SDD-57, PRD §12.6).
//
// Por que isto é uma Edge Function e não um fetch da tela: a chave da HG
// Brasil é um segredo. O app é React Native Web — o bundle é público e
// qualquer chave embutida nele vira chave de todo mundo, junto com a cota que
// o dono do produto paga. `HGBRASIL_API_KEY` vive nos secrets do Supabase e
// nunca sai daqui; o client só recebe números já normalizados.
//
// Dois trabalhos, na ordem:
//  1. Cache — só chama a HG se o último snapshot passou de VALIDADE_MINUTOS.
//     A cota é finita e cotação não muda a cada segundo.
//  2. Histórico — o plano atual da chave NÃO dá série temporal
//     (`/finance/historical` responde "sem plano válido"), então cada captura
//     vira uma linha em `cotacoes_snapshots` e o produto constrói a própria
//     série. Nada de passado inventado (PRD §4).
//
// O que a chave permite hoje (verificado em 02/08/2026): moedas, índices
// (pontos + variação), bitcoin e taxes (CDI/Selic). Ação individual
// (`stock_price?symbol=PETR4`) exige plano Premium — por isso o comparador da
// tela usa renda fixa com taxa real e, para renda variável, um cenário que o
// próprio usuário digita (RN-33).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HGBRASIL_API_KEY = Deno.env.get("HGBRASIL_API_KEY")!;

const VALIDADE_MINUTOS = 15;
const MAX_PONTOS_HISTORICO = 60;

interface Indicador {
  chave: string;
  nome: string;
  valor: number;
  variacaoPct: number | null;
  /** `cambio` existe separado de `brl` porque dólar precisa de 4 casas e Bitcoin não. */
  unidade: "brl" | "cambio" | "pontos" | "pct";
}

interface Cotacoes {
  taxas: { cdiAnualPct: number; selicAnualPct: number };
  indicadores: Indicador[];
}

/** Traduz o payload da HG pro formato do produto — um lugar só pra absorver mudança de fornecedor. */
function normalizar(bruto: Record<string, any>): Cotacoes {
  const r = bruto?.results ?? {};
  const taxa = Array.isArray(r.taxes) ? r.taxes[0] ?? {} : {};
  const moedas = r.currencies ?? {};
  const indices = r.stocks ?? {};
  const bitcoin = r.bitcoin ?? {};

  const indicadores: Indicador[] = [];

  const push = (chave: string, nome: string, valor: unknown, variacao: unknown, unidade: Indicador["unidade"]) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return;
    // `Number(null)` é 0, não NaN — sem este short-circuit CDI e Selic
    // apareciam na tela como "▲ 0,00%", inventando uma variação diária que
    // a fonte nunca mandou. Bug pego no primeiro teste com dado real.
    const v = variacao === null || variacao === undefined ? null : Number(variacao);
    indicadores.push({
      chave,
      nome,
      valor: numero,
      variacaoPct: v !== null && Number.isFinite(v) ? v : null,
      unidade,
    });
  };

  push("cdi", "CDI", taxa.cdi, null, "pct");
  push("selic", "Selic", taxa.selic, null, "pct");
  push("usd", "Dólar", moedas?.USD?.sell ?? moedas?.USD?.buy, moedas?.USD?.variation, "cambio");
  push("eur", "Euro", moedas?.EUR?.sell ?? moedas?.EUR?.buy, moedas?.EUR?.variation, "cambio");
  push("ibovespa", "Ibovespa", indices?.IBOVESPA?.points, indices?.IBOVESPA?.variation, "pontos");
  push("ifix", "IFIX (fundos imobiliários)", indices?.IFIX?.points, indices?.IFIX?.variation, "pontos");

  // A HG devolve bitcoin por corretora; pegamos a primeira que trouxer preço.
  const primeiraCorretora = Object.values(bitcoin).find((b: any) => Number.isFinite(Number(b?.last)));
  if (primeiraCorretora) {
    push("bitcoin", "Bitcoin", (primeiraCorretora as any).last, (primeiraCorretora as any).variation, "brl");
  }

  return {
    taxas: { cdiAnualPct: Number(taxa.cdi) || 0, selicAnualPct: Number(taxa.selic) || 0 },
    indicadores,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Faltando header Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // Service role só pra escrever o snapshot: a tabela não tem policy de
    // insert de propósito (é conteúdo do produto, não dado de usuário).
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: ultimo } = await admin
      .from("cotacoes_snapshots")
      .select("capturado_em, dados")
      .order("capturado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    const idadeMinutos = ultimo
      ? (Date.now() - new Date(ultimo.capturado_em).getTime()) / 60_000
      : Number.POSITIVE_INFINITY;

    let cotacoes: Cotacoes;
    let capturadoEm: string;
    let deCache = true;

    if (idadeMinutos <= VALIDADE_MINUTOS && ultimo) {
      cotacoes = ultimo.dados as unknown as Cotacoes;
      capturadoEm = ultimo.capturado_em;
    } else {
      const resposta = await fetch(`https://api.hgbrasil.com/finance?key=${HGBRASIL_API_KEY}`);
      if (!resposta.ok) throw new Error(`HG Brasil respondeu ${resposta.status}`);
      const bruto = await resposta.json();
      if (bruto?.valid_key === false) throw new Error("Chave da HG Brasil inválida");

      cotacoes = normalizar(bruto);
      if (cotacoes.indicadores.length === 0) throw new Error("HG Brasil não devolveu nenhum indicador utilizável");

      const { data: inserido, error: erroInsert } = await admin
        .from("cotacoes_snapshots")
        .insert({ dados: cotacoes })
        .select("capturado_em")
        .single();
      if (erroInsert) throw erroInsert;

      capturadoEm = inserido.capturado_em;
      deCache = false;
    }

    // Série que o produto acumulou até agora — o gráfico só mostra isto.
    const { data: historico } = await admin
      .from("cotacoes_snapshots")
      .select("capturado_em, dados")
      .order("capturado_em", { ascending: false })
      .limit(MAX_PONTOS_HISTORICO);

    const serie = (historico ?? [])
      .map((linha) => ({
        capturadoEm: linha.capturado_em,
        indicadores: (linha.dados as unknown as Cotacoes).indicadores ?? [],
      }))
      .reverse();

    return new Response(
      JSON.stringify({ ...cotacoes, capturadoEm, deCache, fonte: "HG Brasil Finance", serie }),
      { headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
