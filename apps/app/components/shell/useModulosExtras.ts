import { useEffect, useState } from "react";
import { getCurrentSession, listMyModules, type MyModule } from "@serdono/supabase";

/** Slug do módulo que É a Jornada — tem aba própria, não repete no drawer. */
export const JORNADA_SLUG = "jornada-empreendedora";

/**
 * Detecta módulos liberados além da Jornada (SDD-53/SDD-59) — extraído do
 * `MobileTabBar` quando o drawer (`AppDrawer.tsx`) assumiu essa lista: a
 * barra de abas nativa parou de precisar saber de módulos (§7 do plano de
 * 03/08/2026, DS-22), mas o drawer ainda precisa mostrar quais estão
 * liberados de fato — nunca uma seção vazia (RN-2).
 */
export function useModulosExtras() {
  const [temOutrosModulos, setTemOutrosModulos] = useState(false);
  const [modulos, setModulos] = useState<MyModule[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session || !active) return;
        const lista = await listMyModules(session.user.id);
        if (!active) return;
        const extras = lista.filter((m) => m.slug !== JORNADA_SLUG);
        setModulos(extras);
        setTemOutrosModulos(extras.length > 0);
      } catch {
        // Falha de rede aqui só esconde uma seção opcional do drawer — não
        // vale derrubar a navegação inteira do app por isso.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { temOutrosModulos, modulos };
}
