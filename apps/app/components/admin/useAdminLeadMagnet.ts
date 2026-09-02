import { useEffect, useMemo, useRef, useState } from "react";
import {
  atualizarLeadMagnet,
  excluirLeadMagnet,
  excluirLeadsMagnet,
  listarEmailsLeadMagnet,
  listarLeadsMagnet,
  type AdminLeadMagnetPatch,
  type AdminLeadMagnetRow,
} from "@serdono/supabase";
import { EBOOK } from "../../data/ebook";

const POR_PAGINA = 15;

/** Copia texto pra área de transferência na web sem nunca lançar. Tenta a API
 * moderna (pode falhar por permissão/contexto inseguro) e cai no
 * `execCommand("copy")` via textarea oculto. Em nativo, no-op (retorna false).
 */
async function copiarTexto(texto: string): Promise<boolean> {
  if (typeof document === "undefined") return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // segue pro fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Painel Admin de leads do e-book (SDD-140) — dado/ação fora do componente
 * de tela (SDD-3), mesmo padrão de `useAdminAssinaturas`. Busca e paginação
 * são server-side (`listarLeadsMagnet`); a seleção múltipla (pra exclusão em
 * lote e, no futuro, disparo de e-mail) vive só no client.
 */
export function useAdminLeadMagnet() {
  const [rows, setRows] = useState<AdminLeadMagnetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [buscaInput, setBuscaInput] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Debounce da busca — 350ms sem digitar antes de bater no banco.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPagina(1);
      setBusca(buscaInput.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buscaInput]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listarLeadsMagnet({
        busca: busca || undefined,
        leadMagnet: EBOOK.slug,
        pagina,
        porPagina: POR_PAGINA,
      });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, busca]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hasPrev = pagina > 1;
  const hasNext = pagina < totalPaginas;

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selecionarPagina() {
    setSelecionados((prev) => {
      const next = new Set(prev);
      const todosDaPagina = rows.every((r) => next.has(r.id));
      for (const r of rows) {
        if (todosDaPagina) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
  }

  async function salvarEdicao(id: string, patch: AdminLeadMagnetPatch) {
    setActingOn(id);
    setError(null);
    setFeedback(null);
    try {
      await atualizarLeadMagnet(id, patch);
      setFeedback("Cadastro atualizado.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setActingOn(null);
    }
  }

  async function excluir(id: string) {
    setActingOn(id);
    setError(null);
    setFeedback(null);
    try {
      await excluirLeadMagnet(id);
      setSelecionados((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setFeedback("Cadastro excluído.");
      if (rows.length === 1 && pagina > 1) setPagina((p) => p - 1);
      else await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingOn(null);
    }
  }

  async function excluirSelecionados() {
    const ids = [...selecionados];
    if (ids.length === 0) return;
    setActingOn("__bulk__");
    setError(null);
    setFeedback(null);
    try {
      await excluirLeadsMagnet(ids);
      setFeedback(`${ids.length} cadastro${ids.length === 1 ? "" : "s"} excluído${ids.length === 1 ? "" : "s"}.`);
      limparSelecao();
      setPagina(1);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingOn(null);
    }
  }

  async function copiarEmails(): Promise<{ total: number; copiado: boolean; texto: string }> {
    setError(null);
    setFeedback(null);
    const emails = await listarEmailsLeadMagnet(EBOOK.slug);
    const texto = emails.join(", ");
    const copiado = await copiarTexto(texto);
    const plural = emails.length === 1 ? "" : "s";
    setFeedback(
      copiado
        ? `${emails.length} e-mail${plural} copiado${plural} pra área de transferência.`
        : `${emails.length} e-mail${plural} pronto${plural} — copie da caixa abaixo (a cópia automática foi bloqueada pelo navegador).`
    );
    return { total: emails.length, copiado, texto };
  }

  const selecionadosCount = selecionados.size;
  const paginaTodaSelecionada = useMemo(
    () => rows.length > 0 && rows.every((r) => selecionados.has(r.id)),
    [rows, selecionados]
  );

  return {
    rows,
    total,
    pagina,
    totalPaginas,
    hasPrev,
    hasNext,
    setPagina,
    buscaInput,
    setBuscaInput,
    loading,
    error,
    feedback,
    actingOn,
    selecionados,
    selecionadosCount,
    paginaTodaSelecionada,
    toggleSelecionado,
    selecionarPagina,
    limparSelecao,
    salvarEdicao,
    excluir,
    excluirSelecionados,
    copiarEmails,
    refresh,
  };
}
