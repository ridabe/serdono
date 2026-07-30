import { useEffect, useState } from "react";
import {
  createParceiro,
  listParceiros,
  setParceiroAtivo,
  supabase,
  type FornecedorParceiro,
  type ParceiroInput,
} from "@serdono/supabase";

export interface NicheOption {
  id: string;
  nome: string;
}

export function useAdminFornecedores() {
  const [parceiros, setParceiros] = useState<FornecedorParceiro[]>([]);
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [listaParceiros, { data: nichesData, error: nichesError }] = await Promise.all([
        listParceiros(),
        supabase.from("niches").select("id, nome").order("nome"),
      ]);
      if (nichesError) throw nichesError;
      setParceiros(listaParceiros);
      setNiches(nichesData ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(params: ParceiroInput) {
    setSaving(true);
    setError(null);
    try {
      await createParceiro(params);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(parceiro: FornecedorParceiro) {
    setError(null);
    try {
      await setParceiroAtivo(parceiro.id, !parceiro.ativo);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return { parceiros, niches, loading, saving, error, create, toggleAtivo };
}
