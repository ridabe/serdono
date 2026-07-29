import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { getCurrentSession, supabase, uploadAvatar } from "@serdono/supabase";

/**
 * Estado e ações do formulário de perfil (nome, telefone, foto) — reused por
 * CompletarCadastroScreen (gate obrigatório pós-login) e PerfilScreen (edição
 * livre, "sempre que desejar", SPEC.md SDD-26), pra não duplicar a lógica de
 * carregar/validar/subir foto/salvar em dois lugares.
 */
export function usePerfilForm() {
  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = await getCurrentSession();
      if (!session) {
        setLoadingProfile(false);
        return;
      }
      setUserId(session.user.id);

      const metaNome = (session.user.user_metadata?.full_name ?? session.user.user_metadata?.name) as
        | string
        | undefined;

      const { data } = await supabase.from("users").select("nome, telefone, avatar_url").eq("id", session.user.id).maybeSingle();
      setNome(data?.nome ?? metaNome ?? "");
      setTelefone(data?.telefone ?? "");
      setAvatarUri(data?.avatar_url ?? null);
      setLoadingProfile(false);
    })();
  }, []);

  async function handlePickPhoto() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Precisamos de permissão para acessar suas fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    // DS: padroniza toda foto de perfil pro mesmo formato antes de subir —
    // quadrado 512x512, JPEG, compressão 0.7 (leve, cobre exibição em
    // radius.full em qualquer densidade de tela razoável).
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    setAvatarUri(manipulated.uri);
  }

  async function save(): Promise<boolean> {
    setError(null);
    if (!nome.trim()) {
      setError("Como podemos te chamar?");
      return false;
    }
    if (!telefone.trim()) {
      setError("Informe um telefone de contato.");
      return false;
    }
    if (!userId) {
      setError("Sessão perdida — faça login de novo.");
      return false;
    }

    setSaving(true);
    try {
      // Só sobe de novo se for uma foto local nova (file:/blob:/data: da
      // manipulação) — se já veio de um avatar_url salvo (http), reaproveita.
      let avatar_url: string | null = avatarUri;
      if (avatarUri && !avatarUri.startsWith("http")) {
        avatar_url = await uploadAvatar(userId, avatarUri);
        setAvatarUri(avatar_url);
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ nome: nome.trim(), telefone: telefone.trim(), avatar_url })
        .eq("id", userId);
      if (updateError) throw updateError;

      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    nome,
    setNome,
    telefone,
    setTelefone,
    avatarUri,
    handlePickPhoto,
    loadingProfile,
    saving,
    error,
    save,
  };
}
