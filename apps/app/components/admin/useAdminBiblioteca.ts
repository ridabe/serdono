import { useEffect, useState } from "react";
import {
  addAula,
  createConteudo,
  deleteAula,
  deleteConteudo,
  getConteudo,
  listConteudosAdmin,
  updateConteudo,
  type BibliotecaConteudo,
  type ConteudoComAulas,
  type ConteudoInput,
} from "@serdono/supabase";

export function useAdminBiblioteca() {
  const [conteudos, setConteudos] = useState<BibliotecaConteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aulas só são carregadas quando o admin expande um curso — evita N+1 pra
  // todo conteúdo que não é curso.
  const [aulasAbertas, setAulasAbertas] = useState<Record<string, ConteudoComAulas>>({});
  const [carregandoAulas, setCarregandoAulas] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setConteudos(await listConteudosAdmin());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(input: ConteudoInput) {
    setSaving(true);
    setError(null);
    try {
      await createConteudo(input);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(conteudo: BibliotecaConteudo) {
    setError(null);
    try {
      await updateConteudo(conteudo.id, { ativo: !conteudo.ativo });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await deleteConteudo(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleAulas(conteudoId: string) {
    if (aulasAbertas[conteudoId]) {
      setAulasAbertas((prev) => {
        const { [conteudoId]: _removido, ...resto } = prev;
        return resto;
      });
      return;
    }
    setCarregandoAulas(conteudoId);
    setError(null);
    try {
      const completo = await getConteudo(conteudoId);
      if (completo) setAulasAbertas((prev) => ({ ...prev, [conteudoId]: completo }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCarregandoAulas(null);
    }
  }

  async function criarAula(conteudoId: string, input: { titulo: string; video_url?: string; duracao_min?: number }) {
    setError(null);
    try {
      const atual = aulasAbertas[conteudoId];
      await addAula(conteudoId, { ...input, ordem: atual?.aulas.length ?? 0 });
      const atualizado = await getConteudo(conteudoId);
      if (atualizado) setAulasAbertas((prev) => ({ ...prev, [conteudoId]: atualizado }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removerAula(conteudoId: string, aulaId: string) {
    setError(null);
    try {
      await deleteAula(aulaId);
      const atualizado = await getConteudo(conteudoId);
      if (atualizado) setAulasAbertas((prev) => ({ ...prev, [conteudoId]: atualizado }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return {
    conteudos,
    loading,
    saving,
    error,
    create,
    toggleAtivo,
    remove,
    aulasAbertas,
    carregandoAulas,
    toggleAulas,
    criarAula,
    removerAula,
  };
}
