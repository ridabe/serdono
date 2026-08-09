/**
 * Pop-up de novidade de módulo (SDD-3): agrupamento puro, sem rede. Módulos
 * lançados juntos (`anuncioGrupo` igual) viram 1 grupo/pop-up só; módulo sem
 * grupo vira um grupo sozinho, chaveado pelo próprio id.
 */

export interface ModuloParaNovidade {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  anuncioGrupo: string | null;
}

export interface GrupoNovidadeModulo {
  chave: string;
  modulos: ModuloParaNovidade[];
}

export function agruparNovidadesModulos(modulos: ModuloParaNovidade[]): GrupoNovidadeModulo[] {
  const ordemChaves: string[] = [];
  const porChave = new Map<string, ModuloParaNovidade[]>();

  for (const modulo of modulos) {
    const chave = modulo.anuncioGrupo ?? modulo.id;
    if (!porChave.has(chave)) {
      porChave.set(chave, []);
      ordemChaves.push(chave);
    }
    porChave.get(chave)!.push(modulo);
  }

  return ordemChaves.map((chave) => ({ chave, modulos: porChave.get(chave)! }));
}
