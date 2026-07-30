import { useEffect, useState } from "react";
import {
  chooseNomeEmpresa,
  generateNomesEmpresa,
  getNomesEmpresa,
  type CandidatoNomeEmpresa,
  type JornadaInstance,
} from "@serdono/supabase";

/**
 * Fase 3 — Planejamento, Etapa 1: Nome da Empresa (SDD-34). Palavras-chave
 * -> IA gera 10 nomes -> checagem de domínio/Instagram de cada um -> escolha
 * final (RN-9-like: a conclusão da etapa é a própria escolha do usuário,
 * mesmo espírito de validacao_clientes_reais).
 */
export function useNomeEmpresa(jornada: JornadaInstance, onEtapasChanged: () => Promise<void>) {
  const [palavrasChaveInput, setPalavrasChaveInput] = useState("");
  const [candidatos, setCandidatos] = useState<CandidatoNomeEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNomesEmpresa(jornada.id)
      .then((res) => {
        if (res) {
          setCandidatos(res.candidatos);
          setPalavrasChaveInput(res.palavras_chave.join(", "));
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [jornada.id]);

  async function generate() {
    const palavrasChave = palavrasChaveInput
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (palavrasChave.length === 0) return;

    setGenerating(true);
    setError(null);
    try {
      const novosCandidatos = await generateNomesEmpresa(jornada.id, palavrasChave);
      setCandidatos(novosCandidatos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function choose(nome: string) {
    setChoosing(nome);
    setError(null);
    try {
      await chooseNomeEmpresa(jornada.id, nome);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChoosing(null);
    }
  }

  return {
    palavrasChaveInput,
    setPalavrasChaveInput,
    candidatos,
    loading,
    generating,
    generate,
    choose,
    choosing,
    nomeEscolhido: jornada.nome_empresa_escolhido,
    error,
  };
}
