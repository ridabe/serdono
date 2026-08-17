import { useEffect, useState } from "react";
import { getCurrentSession, getJornadaConclusaoConfig, listMyModules, type MyModule } from "@serdono/supabase";
import { exportCertificadoConclusaoPdf } from "./jornadaConclusaoCertificadoPdf";

const SLUG_JORNADA_EMPREENDEDORA = "jornada-empreendedora";

/**
 * Tela de conclusão da Jornada (SDD-49). Só 2 fontes de dado além do que
 * `JornadaScreen` já carregou: a config global (vídeo da equipe, ainda vazia
 * hoje) e o catálogo de módulos já liberados pro usuário — pra convidar
 * honestamente pro próximo módulo só se ele já existir e estiver liberado
 * (nunca uma promessa de módulo/plano que ainda não foi decidido, RN-2).
 */
export function useJornadaConclusao(nomeEmpresa: string, nicheName: string | null) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [proximosModulos, setProximosModulos] = useState<MyModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [baixandoCertificado, setBaixandoCertificado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const config = await getJornadaConclusaoConfig();
        const session = await getCurrentSession();
        const modulos = session ? await listMyModules(session.user.id) : [];
        if (cancelado) return;
        setVideoUrl(config.videoUrl);
        // Nunca convida pra um módulo que o plano atual não atende (RN-2/
        // RN-29: só menciona o que já está de fato liberado) — `bloqueado`
        // existe pra virar upsell no catálogo/menu, não nesta lista honesta.
        setProximosModulos(modulos.filter((m) => m.slug !== SLUG_JORNADA_EMPREENDEDORA && !m.bloqueado));
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

  async function baixarCertificado() {
    setBaixandoCertificado(true);
    setError(null);
    try {
      await exportCertificadoConclusaoPdf(nomeEmpresa, nicheName);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBaixandoCertificado(false);
    }
  }

  return { videoUrl, proximosModulos, loading, baixarCertificado, baixandoCertificado, error };
}
