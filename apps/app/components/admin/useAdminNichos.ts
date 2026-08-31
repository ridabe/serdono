import { useEffect, useState } from "react";
import {
  apagarNicho,
  contarNichosCurados,
  listNichosGeradosPelaIa,
  promoverNichoParaCurado,
  type NichoRow,
} from "@serdono/supabase";

export function useAdminNichos() {
  const [nichos, setNichos] = useState<NichoRow[]>([]);
  const [totalCurados, setTotalCurados] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoEmId, setAcaoEmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [lista, curados] = await Promise.all([listNichosGeradosPelaIa(), contarNichosCurados()]);
      setNichos(lista);
      setTotalCurados(curados);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function promover(id: string): Promise<void> {
    setAcaoEmId(id);
    setError(null);
    try {
      await promoverNichoParaCurado(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAcaoEmId(null);
    }
  }

  async function apagar(id: string): Promise<void> {
    setAcaoEmId(id);
    setError(null);
    try {
      await apagarNicho(id);
      await refresh();
    } catch (e) {
      const msg = (e as { code?: string; message: string });
      setError(
        msg.code === "23503"
          ? "Não dá pra apagar: alguém já começou uma Jornada com esse ramo. Promova a curado ou ajuste os dados direto no banco."
          : msg.message
      );
    } finally {
      setAcaoEmId(null);
    }
  }

  return { nichos, totalCurados, loading, acaoEmId, error, promover, apagar };
}
