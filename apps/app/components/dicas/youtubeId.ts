/** Extrai o ID de 11 caracteres de uma URL do YouTube (watch, youtu.be ou embed). */
export function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}
