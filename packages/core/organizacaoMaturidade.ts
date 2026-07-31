/**
 * Diagnóstico de Maturidade Organizacional — Jornada Empreendedora, Fase
 * Organização do Negócio (PRD §9.12, SPEC.md SDD-48).
 *
 * Mesmo espírito de `fitScore.ts`: nota CALCULADA a partir de respostas
 * reais do empreendedor, nunca gerada por IA — função pura, testável sem
 * rede, para não gastar token calculando algo que é só soma de respostas
 * sim/não.
 */

export interface PerguntaDiagnostico {
  id: string;
  texto: string;
  /** Mostrado quando a resposta indica risco (considerando `inverso`). */
  risco: string;
  /** Pergunta de maior prioridade — entra primeiro na lista de prioridades quando reprovada. */
  critica?: boolean;
  /** `true` = a pergunta descreve um comportamento ruim (ex.: "costuma esquecer..."), então responder "sim" é o risco, não "não". */
  inverso?: boolean;
}

export const PERGUNTAS_DIAGNOSTICO: PerguntaDiagnostico[] = [
  {
    id: "separa_dinheiro",
    texto: "Você separa o dinheiro pessoal do dinheiro da empresa?",
    risco: "Misturar dinheiro pessoal e da empresa é a causa mais comum de um negócio parecer saudável sem estar.",
    critica: true,
  },
  {
    id: "conta_exclusiva",
    texto: "Possui uma conta bancária exclusiva para o negócio?",
    risco: "Sem conta exclusiva, fica difícil saber quanto o negócio realmente tem disponível.",
    critica: true,
  },
  {
    id: "registra_vendas",
    texto: "Registra todas as vendas?",
    risco: "Sem registro de vendas, não dá pra saber o que realmente vende mais nem se o mês foi bom.",
    critica: true,
  },
  { id: "registra_despesas", texto: "Registra todas as despesas?", risco: "Despesa não registrada corrói o lucro sem ninguém perceber." },
  { id: "sabe_a_pagar", texto: "Sabe quanto precisa pagar nos próximos dias?", risco: "Sem isso, pagamento atrasado vira surpresa recorrente." },
  { id: "sabe_a_receber", texto: "Sabe quanto tem para receber?", risco: "Sem isso, fica difícil planejar o caixa dos próximos dias." },
  { id: "guarda_notas", texto: "Guarda notas fiscais e comprovantes?", risco: "Falta de comprovante pode gerar problema fiscal ou perda de garantia." },
  { id: "controla_estoque", texto: "Controla materiais ou estoque?", risco: "Sem controle, é fácil comprar demais ou ficar sem o essencial na hora de vender." },
  { id: "rotina_pedidos", texto: "Possui uma rotina para conferir pedidos?", risco: "Pedido esquecido custa cliente." },
  { id: "usa_planilha_sistema", texto: "Usa alguma planilha ou sistema?", risco: "Depender só da memória não escala conforme o negócio cresce." },
  { id: "sabe_produto_lucro", texto: "Sabe qual produto ou serviço gera mais lucro?", risco: "Sem isso, o esforço pode estar concentrado no que menos compensa." },
  {
    id: "horario_administrativo",
    texto: "Possui horários definidos para atividades administrativas?",
    risco: "Sem horário fixo, a parte administrativa vira a última prioridade — e acaba nunca acontecendo.",
  },
  { id: "apoio_contador", texto: "Tem contador ou apoio profissional?", risco: "Sem apoio profissional, é fácil perder prazo ou obrigação fiscal." },
  {
    id: "localiza_documentos",
    texto: "Consegue localizar rapidamente contratos e documentos?",
    risco: "Documento perdido custa tempo exatamente na hora em que mais se precisa dele.",
  },
  {
    id: "esquece_compromissos",
    texto: "Costuma esquecer pagamentos, retornos ou entregas?",
    risco: "Compromisso esquecido custa dinheiro e confiança.",
    inverso: true,
  },
];

export interface DiagnosticoResposta {
  id: string;
  resposta: boolean;
}

export type NivelMaturidade = 1 | 2 | 3 | 4;

export interface MaturidadeResultado {
  pontuacaoPct: number;
  nivel: NivelMaturidade;
  nivelLabel: string;
  nivelDescricao: string;
  pontosFortes: string[];
  riscos: string[];
  /** Até 3 riscos, priorizando as perguntas `critica` primeiro. */
  prioridades: string[];
}

const NIVEL_INFO: Record<NivelMaturidade, { label: string; descricao: string }> = {
  1: { label: "Organização inicial", descricao: "O negócio ainda depende muito da memória e possui poucos controles." },
  2: {
    label: "Organização em construção",
    descricao: "Existem alguns registros, mas eles estão espalhados ou são feitos sem frequência.",
  },
  3: {
    label: "Organização estruturada",
    descricao: "Já existem controles básicos — o próximo passo é padronizar e acompanhar com mais frequência.",
  },
  4: {
    label: "Organização preparada para crescer",
    descricao: "O negócio possui processos claros, ferramentas adequadas e indicadores básicos.",
  },
};

function respostaIndicaRisco(pergunta: PerguntaDiagnostico, resposta: boolean): boolean {
  return pergunta.inverso ? resposta === true : resposta === false;
}

function nivelDaPontuacao(pct: number): NivelMaturidade {
  if (pct <= 25) return 1;
  if (pct <= 50) return 2;
  if (pct <= 75) return 3;
  return 4;
}

/** Todas as perguntas têm o mesmo peso — a lista `prioridades` é o que dá destaque às mais críticas, não um peso maior na nota. */
export function calcularMaturidadeOrganizacional(respostas: DiagnosticoResposta[]): MaturidadeResultado {
  const porId = new Map(respostas.map((r) => [r.id, r.resposta]));

  const pontosFortes: string[] = [];
  const riscos: string[] = [];
  const riscosCriticos: string[] = [];
  let acertos = 0;
  let total = 0;

  for (const pergunta of PERGUNTAS_DIAGNOSTICO) {
    const resposta = porId.get(pergunta.id);
    if (resposta == null) continue;
    total += 1;

    const risco = respostaIndicaRisco(pergunta, resposta);
    if (risco) {
      riscos.push(pergunta.risco);
      if (pergunta.critica) riscosCriticos.push(pergunta.risco);
    } else {
      acertos += 1;
      pontosFortes.push(pergunta.texto);
    }
  }

  const pontuacaoPct = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const nivel = nivelDaPontuacao(pontuacaoPct);
  const { label, descricao } = NIVEL_INFO[nivel];

  const prioridades = [...riscosCriticos, ...riscos.filter((r) => !riscosCriticos.includes(r))].slice(0, 3);

  return { pontuacaoPct, nivel, nivelLabel: label, nivelDescricao: descricao, pontosFortes, riscos, prioridades };
}
