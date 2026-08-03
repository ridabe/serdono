import React, { createContext, useContext, useState } from "react";

interface DrawerContextValue {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

/**
 * Estado do menu lateral (SDD-59, DS-22) — montado uma vez no layout
 * protegido (`_layout.tsx`), consumido pelo gatilho no `ScreenHeader`
 * (que fica bem longe do `AppDrawer` na árvore) e pelo próprio `AppDrawer`.
 * Contexto simples de propósito: é só um booleano, não justifica lib de
 * estado global nova.
 */
export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DrawerContext.Provider value={{ open, openDrawer: () => setOpen(true), closeDrawer: () => setOpen(false) }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer precisa estar dentro de DrawerProvider");
  return ctx;
}
