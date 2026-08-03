import { useEffect, useState } from "react";
import {
  createMaterial,
  deleteMaterial,
  listMateriaisAdmin,
  updateMaterial,
  uploadDicaMaterialPdf,
  type DicasMaterial,
  type MaterialInput,
} from "@serdono/supabase";

/** Não precisa ser criptograficamente forte — só desacopla o caminho no bucket do id (ainda inexistente) do material que vai ser criado. Mesmo helper de `AdminFornecedoresScreen.tsx`. */
function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useAdminDicasMateriais(categoriaId: string) {
  const [materiais, setMateriais] = useState<DicasMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setMateriais(await listMateriaisAdmin(categoriaId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [categoriaId]);

  async function create(input: Omit<MaterialInput, "categoria_id">) {
    setSaving(true);
    setError(null);
    try {
      await createMaterial({ categoria_id: categoriaId, ordem: materiais.length, ...input });
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, input: Partial<MaterialInput>) {
    setSaving(true);
    setError(null);
    try {
      await updateMaterial(id, input);
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(material: DicasMaterial) {
    await update(material.id, { ativo: !material.ativo });
  }

  async function remove(id: string) {
    setError(null);
    try {
      await deleteMaterial(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function mover(id: string, direcao: "cima" | "baixo") {
    const i = materiais.findIndex((m) => m.id === id);
    const j = direcao === "cima" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= materiais.length) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all([
        updateMaterial(materiais[i].id, { ordem: materiais[j].ordem }),
        updateMaterial(materiais[j].id, { ordem: materiais[i].ordem }),
      ]);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /** Sobe o PDF pro storage e devolve a URL pública — quem chama decide se cria material novo ou atualiza um existente. */
  async function subirPdf(uri: string): Promise<string | null> {
    setUploadingPdf(true);
    setError(null);
    try {
      return await uploadDicaMaterialPdf(randomId(), uri);
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setUploadingPdf(false);
    }
  }

  return { materiais, loading, saving, uploadingPdf, error, create, update, toggleAtivo, remove, mover, subirPdf };
}
