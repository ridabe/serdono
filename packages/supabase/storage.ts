import { supabase } from "./client";

const AVATARS_BUCKET = "avatars";
const PARCEIROS_LOGOS_BUCKET = "parceiros-logos";

/**
 * Sobe a foto de perfil já padronizada (redimensionada/comprimida pelo
 * caller, ver CompletarCadastroScreen) para o caminho fixo do usuário —
 * upsert:true garante um arquivo só por pessoa, sem acumular lixo no bucket.
 * `fetch(uri).arrayBuffer()` é o caminho oficial Expo+Supabase pra upload de
 * imagem local (funciona igual em web e nativo, sem depender de
 * expo-file-system ou lib de base64).
 */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, arrayBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sobe o logo de um parceiro/fornecedor (Painel Admin, base curada em
 * `fornecedores_parceiros`) — mesmo padrão de `uploadAvatar` (bucket
 * público, upsert por caminho fixo). `parceiroId` é gerado no client antes
 * do parceiro existir na tabela (o cadastro sobe a imagem e insere a linha
 * na mesma ação), então o caminho não depende de um id já persistido.
 */
export async function uploadParceiroLogo(parceiroId: string, uri: string): Promise<string> {
  const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());
  const path = `${parceiroId}/logo.jpg`;

  const { error } = await supabase.storage.from(PARCEIROS_LOGOS_BUCKET).upload(path, arrayBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(PARCEIROS_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
