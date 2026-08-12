import { useEffect, useMemo, useState } from "react";
import { elegivelMaturidadeNegocio, primeiroDiaMesAtualISO } from "@serdono/core";
import { getCurrentSession, getMyJornada, getSnapshotMaturidadeDoMes, gerarSnapshotMaturidade, type MaturidadeSnapshotRow } from "@serdono/supabase";

/**
 * Estado da tela do Nível de Maturidade + Ser Dono Score. Diferente do
 * Check-up/Plano de Ação: não existe pergunta pro usuário responder (o
 * snapshot é calculado só a partir de dado que já existe em outros
 * módulos) — por isso, se elegível e sem snapshot do mês corrente, a
 * geração já dispara sozinha ao carregar a tela, sem esperar um botão.
 */
export function useMaturidade() {
  const [elegivel, setElegivel] = useState(false);
  const [snapshot, setSnapshot] = useState<MaturidadeSnapshotRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mesAtual = useMemo(() => primeiroDiaMesAtualISO(), []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        const jornada = await getMyJornada(session.user.id);
        const podeUsar = elegivelMaturidadeNegocio(!!jornada);
        setElegivel(podeUsar);
        if (!podeUsar) return;

        const existente = await getSnapshotMaturidadeDoMes(session.user.id, mesAtual);
        if (existente) {
          setSnapshot(existente);
          return;
        }

        setCalculando(true);
        setSnapshot(await gerarSnapshotMaturidade());
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
        setCalculando(false);
      }
    })();
  }, [mesAtual]);

  return { loading, calculando, error, elegivel, snapshot };
}
