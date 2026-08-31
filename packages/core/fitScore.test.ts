import { describe, expect, it } from "vitest";
import { calculateFitScore, type DiagnosticoParaScore, type NichoParaScore } from "./fitScore";

const diagnosticoBase: DiagnosticoParaScore = {
  capital_disponivel: "5k_15k",
  meses_de_folego: 6,
  apetite_risco: 3,
  tempo_disponivel: "parcial",
  formacao: ["serviços"],
  experiencia: ["atendimento ao cliente"],
};

const nichoServicosDomiciliares: NichoParaScore = {
  categoria: "serviços",
  investimento_min: 300,
  investimento_max: 3000,
  tempo_ate_equilibrio_meses: 2,
  complexidade_regulatoria: 2,
  intensidade_mao_de_obra: 5,
  nivel_concorrencia: 3,
};

const nichoComercioBairro: NichoParaScore = {
  categoria: "varejo",
  investimento_min: 15000,
  investimento_max: 50000,
  tempo_ate_equilibrio_meses: 10,
  complexidade_regulatoria: 3,
  intensidade_mao_de_obra: 3,
  nivel_concorrencia: 4,
};

const nichoServicoDigital: NichoParaScore = {
  categoria: "tecnologia",
  investimento_min: 300,
  investimento_max: 5000,
  tempo_ate_equilibrio_meses: 3,
  complexidade_regulatoria: 1,
  intensidade_mao_de_obra: 3,
  nivel_concorrencia: 4,
};

describe("calculateFitScore", () => {
  it("retorna nota entre 0 e 100 em todos os componentes", () => {
    const result = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    for (const value of Object.values(result)) {
      if (typeof value !== "number") continue;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("penaliza nicho fora da faixa de capital do usuário", () => {
    const dentroDaFaixa = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    const foraDaFaixa = calculateFitScore(diagnosticoBase, nichoComercioBairro);
    expect(dentroDaFaixa.score_financeiro).toBeGreaterThan(foraDaFaixa.score_financeiro);
  });

  it("é determinístico — mesma entrada gera sempre a mesma nota", () => {
    const a = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    const b = calculateFitScore(diagnosticoBase, nichoServicosDomiciliares);
    expect(a).toEqual(b);
  });

  it("sem capital informado, o score financeiro é zero (nunca positivo por omissão)", () => {
    const semCapital = calculateFitScore({ ...diagnosticoBase, capital_disponivel: null }, nichoServicosDomiciliares);
    expect(semCapital.score_financeiro).toBe(0);
  });

  // Regressão: a versão original media SOBREPOSIÇÃO de faixas, então sobrar
  // dinheiro virava penalidade — quem tinha mais de R$ 40 mil tirava ZERO em
  // nicho barato e era empurrado pra negócio caro fora do seu perfil.
  describe("capital de sobra nunca é penalidade", () => {
    const perfilRico: DiagnosticoParaScore = {
      capital_disponivel: "mais_40k",
      meses_de_folego: 15,
      apetite_risco: 2,
      tempo_disponivel: "integral",
      formacao: ["tecnologia"],
      experiencia: [],
    };

    const nichoCaro: NichoParaScore = {
      categoria: "serviços",
      areas_afinidade: ["serviços"],
      investimento_min: 30000,
      investimento_max: 100000,
      tempo_ate_equilibrio_meses: 12,
      complexidade_regulatoria: 3,
      intensidade_mao_de_obra: 2,
      nivel_concorrencia: 3,
    };

    it("nicho barato não é penalizado por quem tem muito capital", () => {
      const barato = calculateFitScore(perfilRico, nichoServicoDigital);
      expect(barato.score_financeiro).toBe(100);
    });

    it("quem banca tudo tira a mesma nota financeira em nicho barato e caro — aí quem decide é o perfil", () => {
      const barato = calculateFitScore(perfilRico, nichoServicoDigital);
      const caro = calculateFitScore(perfilRico, nichoCaro);
      expect(barato.score_financeiro).toBe(caro.score_financeiro);
      // O nicho da área da pessoa tem que vencer, já que o capital empatou.
      expect(barato.fit_score).toBeGreaterThan(caro.fit_score);
    });

    it("quem não alcança o investimento mínimo continua sendo penalizado de verdade", () => {
      const perfilPobre = { ...perfilRico, capital_disponivel: "ate_5k" as const };
      const r = calculateFitScore(perfilPobre, nichoCaro);
      expect(r.score_financeiro).toBeLessThan(40);
    });

    it("quem banca só o piso do nicho fica abaixo de quem banca a faixa inteira", () => {
      const noPiso = calculateFitScore({ ...perfilRico, capital_disponivel: "15k_40k" }, nichoCaro);
      const folgado = calculateFitScore(perfilRico, nichoCaro);
      expect(noPiso.score_financeiro).toBeLessThan(folgado.score_financeiro);
    });
  });

  // Regressão do bug relatado: usuário marcou só "Tecnologia / digital" na
  // Experiência e o nicho "Serviço digital" nem aparecia entre as 3 sugestões
  // — porque o bônus de área era só +15 pontos, diluído por um peso de 30% no
  // fit_score final (impacto real: no máximo 4,5 pontos em 100).
  const perfilTecnologia: DiagnosticoParaScore = {
    capital_disponivel: "mais_40k",
    meses_de_folego: 15,
    apetite_risco: 2,
    tempo_disponivel: "integral",
    formacao: ["tecnologia"],
    experiencia: [],
  };

  it("área de interesse batendo com a categoria do nicho pesa de verdade no score_perfil", () => {
    const comMatch = calculateFitScore(perfilTecnologia, nichoServicoDigital);
    const semMatch = calculateFitScore(perfilTecnologia, nichoServicosDomiciliares);
    // Os dois nichos têm proxy de risco quase idêntico (mesma distância de
    // apetite_risco) — a diferença de score_perfil só pode vir do interesse.
    expect(comMatch.score_perfil).toBeGreaterThan(semMatch.score_perfil + 20);
  });

  it("reproduz o caso real reportado: nicho de tecnologia vence quando o usuário só marcou tecnologia", () => {
    const servicoDigital = calculateFitScore(perfilTecnologia, nichoServicoDigital);
    const servicosDomiciliares = calculateFitScore(perfilTecnologia, nichoServicosDomiciliares);
    const comercioBairro = calculateFitScore(perfilTecnologia, nichoComercioBairro);
    expect(servicoDigital.fit_score).toBeGreaterThan(servicosDomiciliares.fit_score);
    expect(servicoDigital.fit_score).toBeGreaterThan(comercioBairro.fit_score);
  });

  it("sem nenhuma área marcada, o interesse fica neutro — não penaliza nem favorece nicho nenhum", () => {
    const semArea = calculateFitScore({ ...perfilTecnologia, formacao: [], experiencia: [] }, nichoServicoDigital);
    const comArea = calculateFitScore(perfilTecnologia, nichoServicoDigital);
    expect(semArea.score_perfil).toBeLessThan(comArea.score_perfil);
  });

  it("interesse é avaliado mesmo sem apetite_risco informado (antes o bônus nem era considerado)", () => {
    const semRisco = calculateFitScore({ ...perfilTecnologia, apetite_risco: null }, nichoServicoDigital);
    expect(semRisco.score_perfil).toBeGreaterThan(50);
  });

  // SDD-66: um nicho pode atender mais de uma área do diagnóstico. Antes, a
  // `categoria` única obrigava a escolher — e nichos digitais ficavam
  // escondidos sob 'serviços'/'varejo', invisíveis pra quem marcou tecnologia.
  describe("areas_afinidade", () => {
    const agenciaMarketing: NichoParaScore = {
      categoria: "serviços",
      areas_afinidade: ["tecnologia", "serviços"],
      investimento_min: 1000,
      investimento_max: 15000,
      tempo_ate_equilibrio_meses: 5,
      complexidade_regulatoria: 1,
      intensidade_mao_de_obra: 2,
      nivel_concorrencia: 5,
    };

    it("casa por uma área específica do nicho (tecnologia), não só pela categoria genérica", () => {
      // Categoria é 'serviços', mas o nicho também é de tecnologia.
      const porTecnologia = calculateFitScore(perfilTecnologia, agenciaMarketing);
      const perfilOutraArea = { ...perfilTecnologia, formacao: ["alimentação"] };
      const semMatch = calculateFitScore(perfilOutraArea, agenciaMarketing);
      expect(porTecnologia.score_perfil).toBeGreaterThan(semMatch.score_perfil);
    });

    // SDD-136: "serviços"/"varejo" são rótulo de categoria, não afinidade —
    // casar só por eles quase não vale nada (era a fonte nº 1 de falso positivo,
    // tipo um dev "de serviços" batendo com barbearia "de serviços").
    it("casar só por área genérica ('serviços') pesa bem menos que casar por área específica", () => {
      const porTecnologia = calculateFitScore(perfilTecnologia, agenciaMarketing);
      const soPorServicos = calculateFitScore({ ...perfilTecnologia, formacao: ["serviços"] }, agenciaMarketing);
      expect(soPorServicos.score_perfil).toBeLessThan(porTecnologia.score_perfil);
    });

    it("sem areas_afinidade, continua caindo na categoria (nenhum nicho fica pior que antes)", () => {
      const semAreas: NichoParaScore = { ...agenciaMarketing, areas_afinidade: [] };
      const perfilServicos = { ...perfilTecnologia, formacao: ["serviços"] };
      const comCategoria = calculateFitScore(perfilServicos, semAreas);
      const comAreas = calculateFitScore(perfilServicos, agenciaMarketing);
      expect(comCategoria.score_perfil).toBe(comAreas.score_perfil);
    });

    it("área que não bate com nenhuma das do nicho continua sendo sinal fraco, nunca zero", () => {
      const perfilAlimentacao = { ...perfilTecnologia, formacao: ["alimentação"] };
      const r = calculateFitScore(perfilAlimentacao, agenciaMarketing);
      expect(r.score_perfil).toBeGreaterThan(0);
      expect(r.fit_score).toBeGreaterThan(0);
    });
  });

  // RN-37: a IA amplia o sinal de perfil (texto livre → áreas), nunca decide a nota.
  describe("areas_inferidas", () => {
    it("área inferida pela IA pesa igual a uma marcada no checkbox", () => {
      const marcadaNoCheckbox = calculateFitScore(perfilTecnologia, nichoServicoDigital);
      const inferidaPelaIA = calculateFitScore(
        { ...perfilTecnologia, formacao: [], areas_inferidas: ["tecnologia"] },
        nichoServicoDigital
      );
      expect(inferidaPelaIA.score_perfil).toBe(marcadaNoCheckbox.score_perfil);
    });

    it("sem checkbox e sem inferência, o interesse fica neutro — texto livre é opcional", () => {
      const semNada = calculateFitScore(
        { ...perfilTecnologia, formacao: [], experiencia: [], areas_inferidas: [] },
        nichoServicoDigital
      );
      const comInferencia = calculateFitScore(
        { ...perfilTecnologia, formacao: [], areas_inferidas: ["tecnologia"] },
        nichoServicoDigital
      );
      expect(semNada.score_perfil).toBeLessThan(comInferencia.score_perfil);
    });

    it("inferência soma ao checkbox em vez de substituir — quem marcou e escreveu casa pelos dois", () => {
      const r = calculateFitScore(
        { ...perfilTecnologia, formacao: ["alimentação"], areas_inferidas: ["tecnologia"] },
        nichoServicoDigital
      );
      const soAlimentacao = calculateFitScore({ ...perfilTecnologia, formacao: ["alimentação"] }, nichoServicoDigital);
      expect(r.score_perfil).toBeGreaterThan(soAlimentacao.score_perfil);
    });
  });

  // SDD-135: o motor devolvia nichos fora do contexto declarado. Caso real
  // reportado: "até R$ 5 mil", meio período, marcou Beleza, escreveu "gosto de
  // cortar cabelo e fazer barba" → recebeu vendedor/aulas/serviço digital, e
  // Barbearia em 19º de 31.
  describe("caso barbeiro (SDD-135)", () => {
    const perfilBarbeiro: DiagnosticoParaScore = {
      capital_disponivel: "ate_5k",
      meses_de_folego: null,
      apetite_risco: null,
      tempo_disponivel: "parcial",
      formacao: ["beleza"],
      experiencia: [],
    };

    // Barbearia real do catálogo: piso de mercado R$ 8 mil (assume ponto de
    // rua), mas dá pra começar a primeira cadeira em casa.
    const nichoBarbearia: NichoParaScore = {
      slug: "barbearia",
      categoria: "beleza",
      areas_afinidade: ["beleza", "serviços"],
      investimento_min: 8000,
      investimento_max: 40000,
      tempo_ate_equilibrio_meses: 8,
      complexidade_regulatoria: 2,
      intensidade_mao_de_obra: 4,
      nivel_concorrencia: 5,
      dependencia_ponto_fisico: true,
      permite_inicio_em_casa: true,
    };

    const nichoCabeleireiroCasa: NichoParaScore = {
      slug: "cabeleireiro-a-domicilio",
      categoria: "beleza",
      areas_afinidade: ["beleza", "serviços"],
      investimento_min: 500,
      investimento_max: 5000,
      tempo_ate_equilibrio_meses: 2,
      complexidade_regulatoria: 2,
      intensidade_mao_de_obra: 4,
      nivel_concorrencia: 4,
      dependencia_ponto_fisico: false,
    };

    it("piso de entrada enxuto: capital de R$ 5 mil já dá pra começar uma barbearia em casa", () => {
      const r = calculateFitScore(perfilBarbeiro, nichoBarbearia);
      // Piso enxuto = 8000 * 0.4 = 3200; R$ 5 mil cobre → não é desencaixe.
      expect(r.score_financeiro).toBeGreaterThan(65);
      expect(r.precisa_de_mais_capital).toBe(false);
    });

    it("sem 'permite_inicio_em_casa', o mesmo capital vira desencaixe (piso cheio de R$ 8 mil)", () => {
      const r = calculateFitScore(perfilBarbeiro, { ...nichoBarbearia, permite_inicio_em_casa: false });
      expect(r.score_financeiro).toBeLessThan(50);
      expect(r.precisa_de_mais_capital).toBe(true);
    });

    it("nicho citado no texto livre vira afinidade máxima e é marcado como afinidade direta", () => {
      const semTexto = calculateFitScore(perfilBarbeiro, nichoBarbearia);
      const comTexto = calculateFitScore(
        { ...perfilBarbeiro, nichos_inferidos: ["barbearia"] },
        nichoBarbearia
      );
      expect(comTexto.score_perfil).toBeGreaterThan(semTexto.score_perfil);
      expect(comTexto.afinidade_direta).toBe(true);
      expect(semTexto.afinidade_direta).toBe(false);
    });

    it("Barbearia bate um nicho barato porém sem relação (era o contrário)", () => {
      const barbearia = calculateFitScore(
        { ...perfilBarbeiro, nichos_inferidos: ["barbearia"] },
        nichoBarbearia
      );
      const aulas = calculateFitScore(perfilBarbeiro, {
        slug: "aulas-particulares-idiomas",
        categoria: "educação",
        areas_afinidade: ["educação", "serviços"],
        investimento_min: 300,
        investimento_max: 5000,
        tempo_ate_equilibrio_meses: 3,
        complexidade_regulatoria: 1,
        intensidade_mao_de_obra: 2,
        nivel_concorrencia: 3,
        dependencia_ponto_fisico: false,
      });
      expect(barbearia.fit_score).toBeGreaterThan(aulas.fit_score);
    });

    it("a versão 'de casa' do mesmo ramo fica na frente da versão formal quando o capital é curto", () => {
      const casa = calculateFitScore({ ...perfilBarbeiro, nichos_inferidos: ["barbearia", "cabeleireiro-a-domicilio"] }, nichoCabeleireiroCasa);
      const formal = calculateFitScore({ ...perfilBarbeiro, nichos_inferidos: ["barbearia", "cabeleireiro-a-domicilio"] }, nichoBarbearia);
      expect(casa.fit_score).toBeGreaterThan(formal.fit_score);
    });
  });
});
