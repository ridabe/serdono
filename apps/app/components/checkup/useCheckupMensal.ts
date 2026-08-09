import { useEffect, useMemo, useState } from "react";
import { elegivelCheckupMensal, primeiroDiaMesAtualISO } from "@serdono/core";
import { getCheckupDoMes, getCurrentSession, getMyJornada, gerarCheckupMensal, type CheckupMensalRow } from "@serdono/supabase";

/** Estado da tela do Check-up Mensal do Negócio — elegibilidade, check-up do mês corrente (se já feito) e envio do questionário. */
export function useCheckupMensal() {
  const [userId, setUserId] = useState<string | null>(null);
  const [elegivel, setElegivel] = useState(false);
  const [checkup, setCheckup] = useState<CheckupMensalRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mesAtual = useMemo(() => primeiroDiaMesAtualISO(), []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        const jornada = await getMyJornada(session.user.id);
        const podeUsar = elegivelCheckupMensal(!!jornada);
        setElegivel(podeUsar);
        if (podeUsar) setCheckup(await getCheckupDoMes(session.user.id, mesAtual));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [mesAtual]);

  async function enviar(respostas: Record<string, unknown>): Promise<boolean> {
    if (!userId) return false;
    setEnviando(true);
    setError(null);
    try {
      setCheckup(await gerarCheckupMensal(respostas));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { loading, enviando, error, elegivel, checkup, mesAtual, enviar };
}
