import { useEffect, useState } from "react";
import {
  definirPlanoManualmente,
  getAssinaturasPorPlano,
  getAssinaturasResumo,
  listAssinaturas,
  listPlanosUsuarios,
  sincronizarComAbacatePay,
  type AdminAssinaturaRow,
  type AdminPlanoUsuario,
  type AssinaturaPorPlano,
  type AssinaturasResumo,
} from "@serdono/supabase";
import type { Plano } from "@serdono/core";

/**
 * Painel Admin de Assinaturas (pedido do dono do produto, 17/08/2026) —
 * mesmo padrão de `useAdminUsers.ts`: dado/ação fora do componente de tela
 * (SDD-3). `refresh()` recarrega os 4 dados de leitura de uma vez (resumo,
 * ranking por plano, tabela de usuários e histórico de assinaturas) — as
 * ações (`definirPlano`/`sincronizar`) chamam `refresh()` no final, mesmo
 * espírito de `runAction` de `useAdminUsers.ts`.
 */
export function useAdminAssinaturas() {
  const [resumo, setResumo] = useState<AssinaturasResumo | null>(null);
  const [porPlano, setPorPlano] = useState<AssinaturaPorPlano[]>([]);
  const [usuarios, setUsuarios] = useState<AdminPlanoUsuario[]>([]);
  const [historico, setHistorico] = useState<AdminAssinaturaRow[]>([]);
  const [query, setQuery] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [resumoRes, porPlanoRes, usuariosRes, historicoRes] = await Promise.all([
        getAssinaturasResumo(),
        getAssinaturasPorPlano(),
        listPlanosUsuarios(),
        listAssinaturas(filtroStatus ?? undefined),
      ]);
      setResumo(resumoRes);
      setPorPlano(porPlanoRes);
      setUsuarios(usuariosRes);
      setHistorico(historicoRes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const q = query.trim().toLowerCase();
  const usuariosFiltrados = q
    ? usuarios.filter((u) => (u.nome ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q))
    : usuarios;

  async function definirPlano(userId: string, plano: Plano, nota?: string) {
    setActingOn(userId);
    setError(null);
    setFeedback(null);
    try {
      await definirPlanoManualmente({ userId, plano, nota });
      setFeedback(plano === "gratuito" ? "Plano rebaixado pra gratuito." : `Plano ${plano} concedido.`);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingOn(null);
    }
  }

  async function sincronizar() {
    setSincronizando(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await sincronizarComAbacatePay();
      setFeedback(
        `Sincronização concluída: ${res.verificadas} verificada${res.verificadas === 1 ? "" : "s"}, ` +
          `${res.marcadasInadimplentes} marcada${res.marcadasInadimplentes === 1 ? "" : "s"} inadimplente, ` +
          `${res.sincronizadasCanceladas} cancelamento${res.sincronizadasCanceladas === 1 ? "" : "s"} sincronizado${res.sincronizadasCanceladas === 1 ? "" : "s"}.`
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSincronizando(false);
    }
  }

  return {
    resumo,
    porPlano,
    usuarios: usuariosFiltrados,
    historico,
    query,
    setQuery,
    filtroStatus,
    setFiltroStatus,
    loading,
    actingOn,
    sincronizando,
    error,
    feedback,
    definirPlano,
    sincronizar,
  };
}
