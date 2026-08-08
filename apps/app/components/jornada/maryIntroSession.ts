// Flag em memória (não persistida em disco, de propósito): precisa
// "esquecer" sozinha quando o app fecha de verdade (processo termina,
// módulo recarrega do zero no próximo start) e ser resetada explicitamente
// no logout (ver `(protected)/_layout.tsx`), mas sobreviver a qualquer
// navegação dentro da mesma sessão do app — inclusive sair e voltar pra
// tela da Jornada várias vezes sem fechar o app ou deslogar.
let dismissed = false;

export function isMaryIntroDismissed(): boolean {
  return dismissed;
}

export function dismissMaryIntro(): void {
  dismissed = true;
}

export function resetMaryIntro(): void {
  dismissed = false;
}
