import { useEffect, useState } from "react";
import { agruparNovidadesModulos, type GrupoNovidadeModulo } from "@serdono/core";
import { getCurrentSession, listModulosComNovidadePendente, marcarNovidadesModulosVistas } from "@serdono/supabase";

/**
 * Fila de pop-ups de novidade de módulo (SDD nova, 08/08/2026) — carrega
 * todos os grupos pendentes uma vez ao montar a Início e vai avançando por
 * eles na mesma visita. "Entendi" avança sem marcar (reaparece na próxima
 * vez que abrir a Início); "Não mostrar mais" marca permanente no banco —
 * esse grupo nunca mais aparece pra este usuário.
 */
export function useNovidadesModulos() {
  const [userId, setUserId] = useState<string | null>(null);
  const [fila, setFila] = useState<GrupoNovidadeModulo[]>([]);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) return;
      setUserId(session.user.id);
      const modulos = await listModulosComNovidadePendente(session.user.id);
      setFila(agruparNovidadesModulos(modulos));
    })();
  }, []);

  const grupoAtual = fila[indice] ?? null;

  function avancar() {
    setIndice((i) => i + 1);
  }

  async function naoMostrarMais() {
    if (!grupoAtual || !userId) return;
    const ids = grupoAtual.modulos.map((m) => m.id);
    avancar();
    try {
      await marcarNovidadesModulosVistas(userId, ids);
    } catch {
      // Falha silenciosa: pior caso é o pop-up reaparecer na próxima visita,
      // não travar a navegação por causa de uma preferência de UI.
    }
  }

  return { grupoAtual, entendi: avancar, naoMostrarMais };
}
