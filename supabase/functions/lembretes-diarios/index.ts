// Ser Dono — Edge Function "lembretes-diarios" (notificações push, pedido
// do dono do produto em 08/08/2026: "Analise cada módulo já criado e crie
// essa funcionalidade").
//
// Roda uma vez por dia via pg_cron (`cron.schedule`, ver migration/README de
// deploy). Três análises, cada uma pra um módulo diferente:
//   1. Jornada Empreendedora — etapa `aguardando_usuario` parada há 7+ dias
//      (RN-14 do PRD, nunca implementada até agora).
//   2. Check-up Mensal — ainda não feito este mês, a partir do dia 20.
//   3. Meu Negócio em Dia — obrigação com regra `mensal_dia_fixo` vencendo
//      em até 3 dias e ainda não marcada como resolvida.
//
// Dedupe via `lembretes_enviados` (unique por user+tipo+chave) — cada
// ocorrência só gera 1 push, mesmo rodando todo dia enquanto a condição
// continuar valendo. Só service_role acessa esta function (chamada pelo
// pg_cron com a service_role key, nunca por um client comum).

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Lembrete {
  userId: string;
  tipo: "jornada_etapa_parada" | "checkup_mensal" | "obrigacao_vencendo";
  chave: string;
  titulo: string;
  corpo: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Hoje, no fuso de São Paulo — mesma convenção já usada em `plano-acao-gerar`/`checkup-gerar`. */
function hojeSP(): { ano: number; mes: number; dia: number; iso: string } {
  const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const ano = agora.getFullYear();
  const mes = agora.getMonth() + 1;
  const dia = agora.getDate();
  return { ano, mes, dia, iso: `${ano}-${pad2(mes)}-${pad2(dia)}` };
}

function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

// ============================================================================
// 1. Jornada — etapa aguardando o usuário há 7+ dias sem nenhuma ação.
// ============================================================================
async function coletarLembretesJornada(hoje: { iso: string }): Promise<Lembrete[]> {
  const seteDiasAtras = new Date(new Date(hoje.iso).getTime() - 7 * 86_400_000).toISOString();

  const { data: etapas, error } = await supabase
    .from("jornada_etapas")
    .select("id, updated_at, jornada_instances!inner(user_id), template:jornada_etapa_templates(titulo)")
    .eq("status", "aguardando_usuario")
    .lte("updated_at", seteDiasAtras);
  if (error) throw error;

  return (etapas ?? []).map((e) => ({
    userId: (e as unknown as { jornada_instances: { user_id: string } }).jornada_instances.user_id,
    tipo: "jornada_etapa_parada" as const,
    chave: e.id as string,
    titulo: "Sua Jornada está te esperando",
    corpo: `Você ainda não concluiu "${(e as unknown as { template: { titulo: string } }).template?.titulo ?? "uma etapa"}" — quer continuar de onde parou?`,
  }));
}

// ============================================================================
// 2. Check-up Mensal — ninguém foi lembrado ainda de fazer o check-up deste
// mês, e já estamos a partir do dia 20.
// ============================================================================
async function coletarLembretesCheckup(hoje: { ano: number; mes: number; dia: number }): Promise<Lembrete[]> {
  if (hoje.dia < 20) return [];
  const mesReferencia = `${hoje.ano}-${pad2(hoje.mes)}-01`;

  const [{ data: instances, error: instancesError }, { data: checkupsFeitos, error: checkupsError }] = await Promise.all([
    supabase.from("jornada_instances").select("user_id"),
    supabase.from("checkups_mensais").select("user_id").eq("mes_referencia", mesReferencia),
  ]);
  if (instancesError) throw instancesError;
  if (checkupsError) throw checkupsError;

  const jaFizeram = new Set((checkupsFeitos ?? []).map((c) => c.user_id));
  const usuariosComJornada = new Set((instances ?? []).map((i) => i.user_id));

  return Array.from(usuariosComJornada)
    .filter((userId) => !jaFizeram.has(userId))
    .map((userId) => ({
      userId,
      tipo: "checkup_mensal" as const,
      chave: mesReferencia,
      titulo: "Hora do check-up do seu negócio",
      corpo: "Leva menos de 5 minutos — vamos ver como está a saúde da sua empresa este mês?",
    }));
}

// ============================================================================
// 3. Meu Negócio em Dia — obrigação de vencimento mensal fixo, a até 3 dias
// do prazo e ainda sem marcação de "resolvido" pro período. Só cobre regra
// `mensal_dia_fixo` (a maioria do catálogo real) — `anual_dia_mes`/
// `trimestral`/`variavel` ficam de fora nesta primeira versão (reimplementar
// `proximaOcorrencia` inteiro aqui duplicaria bastante lógica de
// `packages/core/obrigacoes.ts`, que a function não pode importar — mesma
// armadilha de deploy via MCP já documentada nas outras functions).
// ============================================================================
async function coletarLembretesObrigacoes(hoje: { ano: number; mes: number; dia: number }): Promise<Lembrete[]> {
  const JANELA_DIAS = 3;
  const periodoReferencia = `${hoje.ano}-${pad2(hoje.mes)}`;

  const [{ data: configs, error: configsError }, { data: catalogo, error: catalogoError }] = await Promise.all([
    supabase.from("obrigacoes_config").select("user_id, regime, tem_funcionarios"),
    supabase
      .from("obrigacoes_catalogo")
      .select("id, nome, regime, requer_funcionarios, regra_vencimento")
      .eq("ativo", true)
      .eq("regra_vencimento->>tipo", "mensal_dia_fixo"),
  ]);
  if (configsError) throw configsError;
  if (catalogoError) throw catalogoError;
  if (!configs || !catalogo || catalogo.length === 0) return [];

  const diaEsteMes = (dia: number) => Math.min(dia, ultimoDiaDoMes(hoje.ano, hoje.mes));

  const lembretes: Lembrete[] = [];
  for (const config of configs) {
    const aplicaveis = catalogo.filter(
      (o) =>
        (o.regime as string[]).includes(config.regime) &&
        (!o.requer_funcionarios || config.tem_funcionarios)
    );
    for (const obrigacao of aplicaveis) {
      const dia = (obrigacao.regra_vencimento as { dia: number }).dia;
      const vencimento = diaEsteMes(dia);
      const diasRestantes = vencimento - hoje.dia;
      if (diasRestantes < 0 || diasRestantes > JANELA_DIAS) continue;

      const { data: jaConcluido } = await supabase
        .from("obrigacoes_status")
        .select("id")
        .eq("user_id", config.user_id)
        .eq("obrigacao_id", obrigacao.id)
        .eq("periodo_referencia", periodoReferencia)
        .maybeSingle();
      if (jaConcluido) continue;

      lembretes.push({
        userId: config.user_id,
        tipo: "obrigacao_vencendo",
        chave: `${obrigacao.id}:${periodoReferencia}`,
        titulo: "Obrigação vencendo",
        corpo:
          diasRestantes === 0
            ? `${obrigacao.nome} vence hoje.`
            : `${obrigacao.nome} vence em ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}.`,
      });
    }
  }
  return lembretes;
}

/** Registra a ocorrência em `lembretes_enviados` (dedupe) — só segue pra envio se a linha foi inserida de verdade (não existia antes). */
async function filtrarNaoEnviados(lembretes: Lembrete[]): Promise<Lembrete[]> {
  const naoEnviados: Lembrete[] = [];
  for (const l of lembretes) {
    const { data, error } = await supabase
      .from("lembretes_enviados")
      .insert({ user_id: l.userId, tipo: l.tipo, chave: l.chave })
      .select("id")
      .maybeSingle();
    // `error` aqui normalmente é a violação do `unique` (já enviado antes) —
    // tratado como "pula", não como falha da function inteira.
    if (!error && data) naoEnviados.push(l);
  }
  return naoEnviados;
}

async function enviarViaExpo(tokens: string[], titulo: string, corpo: string): Promise<void> {
  if (tokens.length === 0) return;
  const LOTE = 100;
  for (let i = 0; i < tokens.length; i += LOTE) {
    const lote = tokens.slice(i, i + LOTE);
    const mensagens = lote.map((to) => ({ to, title: titulo, body: corpo, sound: "default" }));
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(mensagens),
    });
    if (!response.ok) console.error("Expo push API error", response.status, await response.text());
  }
}

Deno.serve(async (req) => {
  try {
    // Chamada só pelo pg_cron com a service_role key — não precisa de
    // Authorization de usuário, mas confere a service_role pra não virar um
    // endpoint público que qualquer um pode martelar.
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }

    const hoje = hojeSP();
    const [jornada, checkup, obrigacoes] = await Promise.all([
      coletarLembretesJornada(hoje),
      coletarLembretesCheckup(hoje),
      coletarLembretesObrigacoes(hoje),
    ]);

    const candidatos = [...jornada, ...checkup, ...obrigacoes];
    const paraEnviar = await filtrarNaoEnviados(candidatos);

    // Agrupa por (titulo+corpo) exatos pra mandar 1 chamada por mensagem
    // única em vez de 1 por usuário — na prática cada lembrete já tem texto
    // específico por usuário (nome da etapa, obrigação), então isso vira
    // quase sempre 1 grupo por lembrete mesmo, só evita duplicar código.
    for (const lembrete of paraEnviar) {
      const { data: tokens } = await supabase.from("user_push_tokens").select("expo_push_token").eq("user_id", lembrete.userId);
      await enviarViaExpo((tokens ?? []).map((t) => t.expo_push_token), lembrete.titulo, lembrete.corpo);
    }

    return new Response(
      JSON.stringify({
        candidatos: candidatos.length,
        enviados: paraEnviar.length,
        por_tipo: { jornada: jornada.length, checkup: checkup.length, obrigacoes: obrigacoes.length },
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? "Erro inesperado" }), { status: 500 });
  }
});
