import { useEffect, useState } from "react";
import {
  calcularProgressoJornada,
  DESCOBERTA_STEPS,
  FASE_JORNADA_LABEL,
  FASES_JORNADA,
  type JornadaFaseCore,
} from "@serdono/core";
import {
  getCurrentSession,
  getJornadaEtapas,
  getLogoDownloadUrl,
  getMetaCaptacaoSalva,
  getMyJornada,
  isEtapaEstruturaRelevante,
  listJornadaClientesContatos,
  SLUG_PRIMEIRA_VENDA_REGISTRO,
  supabase,
  type JornadaEtapa,
  type JornadaInstance,
  type NicheEstruturaInfo,
} from "@serdono/supabase";

const MAX_MARCOS = 6;

export interface Marco {
  id: string;
  titulo: string;
  fase: string;
  concluidoEm: string;
}

export interface FaseResumo {
  fase: JornadaFaseCore;
  label: string;
  total: number;
  concluidas: number;
}

/**
 * Painel do empreendedor (SDD-50). Agrega, numa leitura só, o que a pessoa
 * precisa ver ao entrar sem querer abrir a Jornada: identidade do negócio,
 * o quanto andou e os marcos reais datados.
 *
 * Regra que vale pra toda a tela: **nenhum número é estimado aqui**. Todo KPI
 * só aparece se o dado real existir (a pessoa preencheu a calculadora,
 * registrou a venda, salvou a meta); senão o card mostra o convite pra
 * preencher, nunca um valor de exemplo — princípio de honestidade do PRD §4.
 */
export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nomeUsuario, setNomeUsuario] = useState<string | null>(null);
  const [jornada, setJornada] = useState<JornadaInstance | null>(null);
  const [nicheName, setNicheName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [etapas, setEtapas] = useState<JornadaEtapa[]>([]);
  const [nicheEstrutura, setNicheEstrutura] = useState<NicheEstruturaInfo | null>(null);
  const [clientesConquistados, setClientesConquistados] = useState(0);
  const [metaClientes, setMetaClientes] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;

        const [{ data: perfil }, instance] = await Promise.all([
          supabase.from("users").select("nome").eq("id", session.user.id).maybeSingle(),
          getMyJornada(session.user.id),
        ]);
        if (cancelado) return;

        setNomeUsuario(perfil?.nome ?? null);
        setJornada(instance);

        if (!instance) return;

        const [etapasCarregadas, contatos, meta] = await Promise.all([
          getJornadaEtapas(instance.id),
          listJornadaClientesContatos(instance.id).catch(() => []),
          getMetaCaptacaoSalva(instance.id).catch(() => null),
        ]);
        if (cancelado) return;

        setEtapas(etapasCarregadas);
        setClientesConquistados(contatos.filter((c) => c.status === "cliente").length);
        setMetaClientes(meta?.metaClientes ?? null);

        if (instance.niche_id) {
          const { data: niche } = await supabase
            .from("niches")
            .select("nome, categoria, dependencia_ponto_fisico")
            .eq("id", instance.niche_id)
            .maybeSingle();
          if (!cancelado && niche) {
            setNicheName(niche.nome);
            setNicheEstrutura({ categoria: niche.categoria, dependencia_ponto_fisico: niche.dependencia_ponto_fisico });
          }
        }

        // O bucket do logo é privado (SDD-35) — precisa de URL assinada.
        if (instance.logo_path) {
          const url = await getLogoDownloadUrl(instance.logo_path).catch(() => null);
          if (!cancelado) setLogoUrl(url);
        }
      } catch (e) {
        if (!cancelado) setError((e as Error).message);
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Mesma filtragem da Jornada: Formalização bifurca por regime (SDD-38) e
  // Estrutura filtra por relevância de nicho (SDD-40). Sem isso o painel
  // mostraria um progresso diferente do da própria Jornada.
  function etapasRelevantesDaFase(fase: JornadaFaseCore): JornadaEtapa[] {
    const daFase = etapas.filter((e) => {
      if (e.template.fase !== fase) return false;
      if (fase === "formalizacao" && jornada?.regime_formalizacao && e.template.aplica_se) {
        return e.template.aplica_se === jornada.regime_formalizacao;
      }
      return true;
    });
    return fase === "estrutura" ? daFase.filter((e) => isEtapaEstruturaRelevante(e.template, nicheEstrutura)) : daFase;
  }

  const progresso = jornada
    ? calcularProgressoJornada(
        jornada.fase_atual,
        FASES_JORNADA.flatMap((fase) =>
          etapasRelevantesDaFase(fase).map((e) => ({ fase, concluida: e.status === "concluida" }))
        )
      )
    : null;

  const fasesResumo: FaseResumo[] = FASES_JORNADA.map((fase) => {
    const relevantes = etapasRelevantesDaFase(fase);
    return {
      fase,
      label: FASE_JORNADA_LABEL[fase],
      total: relevantes.length,
      concluidas: relevantes.filter((e) => e.status === "concluida").length,
    };
  });

  // Marcos = etapas realmente concluídas, mais recentes primeiro. É dado de
  // banco (`concluido_em`), não uma narrativa montada — etapa sem data não
  // entra, em vez de receber uma data inventada.
  const marcos: Marco[] = etapas
    .filter((e) => e.status === "concluida" && e.concluido_em)
    .sort((a, b) => new Date(b.concluido_em!).getTime() - new Date(a.concluido_em!).getTime())
    .slice(0, MAX_MARCOS)
    .map((e) => ({
      id: e.id,
      titulo: e.template.titulo,
      fase: FASE_JORNADA_LABEL[e.template.fase as JornadaFaseCore] ?? e.template.fase,
      concluidoEm: e.concluido_em!,
    }));

  const totalEtapasConcluidas =
    DESCOBERTA_STEPS.length + FASES_JORNADA.reduce((soma, fase) => soma + etapasRelevantesDaFase(fase).filter((e) => e.status === "concluida").length, 0);

  // KPIs — cada um `null` quando o dado real não existe (ver nota do topo).
  const etapaVenda = etapas.find((e) => e.template.slug === SLUG_PRIMEIRA_VENDA_REGISTRO);
  const dadosVenda = etapaVenda?.dados_usuario as unknown as { valor: number | null } | undefined;
  const valorPrimeiraVenda = etapaVenda?.status === "concluida" ? (dadosVenda?.valor ?? null) : null;

  return {
    loading,
    error,
    nomeUsuario,
    jornada,
    nicheName,
    logoUrl,
    progresso,
    fasesResumo,
    marcos,
    totalEtapasConcluidas,
    valorPrimeiraVenda,
    clientesConquistados,
    metaClientes,
  };
}
