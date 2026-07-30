import { useEffect, useState } from "react";
import {
  chooseLogoFinal,
  generateIdentidadeVisual,
  getIdentidadeVisual,
  getLogoDownloadUrl,
  type IdentidadeVisualRespostas,
  type JornadaEtapa,
  type JornadaInstance,
  type LogoCandidato,
  type LogoEstilo,
} from "@serdono/supabase";

const SLUG_IDENTIDADE_VISUAL = "planejamento_identidade_visual";

/**
 * Fase 3 — Planejamento, Etapa 2: Identidade Visual (SDD-35). Questionário
 * curto (valores, personalidade, tom, cores) -> IA gera slogan + 3 rascunhos
 * de logo em qualidade baixa -> usuário escolhe -> sistema gera a versão
 * final em alta qualidade e guarda no Storage privado do usuário.
 */
export function useIdentidadeVisual(jornada: JornadaInstance, etapas: JornadaEtapa[], onEtapasChanged: () => Promise<void>) {
  const etapa = etapas.find((e) => e.template.slug === SLUG_IDENTIDADE_VISUAL);
  const respostasSalvas = etapa?.dados_usuario as Partial<IdentidadeVisualRespostas> | undefined;

  const [valoresInput, setValoresInput] = useState((respostasSalvas?.valores ?? []).join(", "));
  const [personalidadeInput, setPersonalidadeInput] = useState((respostasSalvas?.personalidade ?? []).join(", "));
  const [tomComunicacao, setTomComunicacao] = useState<"formal" | "casual">(
    (respostasSalvas?.tom_comunicacao as "formal" | "casual") ?? "casual"
  );
  const [coresPreferidasInput, setCoresPreferidasInput] = useState((respostasSalvas?.cores_preferidas ?? []).join(", "));
  const [coresEvitarInput, setCoresEvitarInput] = useState((respostasSalvas?.cores_evitar ?? []).join(", "));

  const [slogan, setSlogan] = useState(jornada.slogan_escolhido ?? "");
  const [candidatos, setCandidatos] = useState<LogoCandidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [choosingEstilo, setChoosingEstilo] = useState<LogoEstilo | null>(null);
  const [downloadingLogo, setDownloadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIdentidadeVisual(jornada.id)
      .then((res) => {
        if (res) {
          setSlogan(res.slogan);
          setCandidatos(res.candidatos);
        }
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [jornada.id]);

  function parseLista(input: string): string[] {
    return input
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  async function generate() {
    const respostas: IdentidadeVisualRespostas = {
      valores: parseLista(valoresInput),
      personalidade: parseLista(personalidadeInput),
      tom_comunicacao: tomComunicacao,
      cores_preferidas: parseLista(coresPreferidasInput),
      cores_evitar: parseLista(coresEvitarInput),
    };
    if (respostas.valores.length === 0 || respostas.personalidade.length === 0 || respostas.cores_preferidas.length === 0) {
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const res = await generateIdentidadeVisual(jornada.id, respostas);
      setSlogan(res.slogan);
      setCandidatos(res.candidatos);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function chooseLogo(estilo: LogoEstilo) {
    setChoosingEstilo(estilo);
    setError(null);
    try {
      await chooseLogoFinal(jornada.id, estilo);
      await onEtapasChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChoosingEstilo(null);
    }
  }

  async function downloadLogo(): Promise<string | null> {
    if (!jornada.logo_path) return null;
    setDownloadingLogo(true);
    setError(null);
    try {
      return await getLogoDownloadUrl(jornada.logo_path);
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setDownloadingLogo(false);
    }
  }

  const canGenerate =
    valoresInput.trim().length > 0 && personalidadeInput.trim().length > 0 && coresPreferidasInput.trim().length > 0;

  return {
    valoresInput,
    setValoresInput,
    personalidadeInput,
    setPersonalidadeInput,
    tomComunicacao,
    setTomComunicacao,
    coresPreferidasInput,
    setCoresPreferidasInput,
    coresEvitarInput,
    setCoresEvitarInput,
    canGenerate,
    slogan,
    candidatos,
    loading,
    generating,
    generate,
    chooseLogo,
    choosingEstilo,
    logoPath: jornada.logo_path,
    downloadLogo,
    downloadingLogo,
    bloqueada: etapa?.status === "bloqueada",
    error,
  };
}
