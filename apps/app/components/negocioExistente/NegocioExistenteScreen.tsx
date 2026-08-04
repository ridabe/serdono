import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button, EntrepreneurBackground, Logo, color, radius, space, type } from "@serdono/ui";
import {
  FASES_JORNADA,
  FASE_JORNADA_LABEL,
  type JornadaFaseCore,
} from "@serdono/core";
import {
  ensureSession,
  getCurrentSession,
  isAnonymousSession,
  startJornadaComProgresso,
  supabase,
  type RegimeFormalizacao,
} from "@serdono/supabase";
import { pickEntrepreneurPhoto } from "../../constants/entrepreneurPhotos";

const BACKGROUND_PHOTO = pickEntrepreneurPhoto("cadastro");

interface NicheOption {
  id: string;
  nome: string;
  categoria: string;
}

/** Uma pergunta objetiva por fase (SDD-52) — nunca "quão avançado você está" num controle só, porque quem já empreende raramente é linear (pode ter CNPJ e não ter fornecedor definido, por exemplo). */
const PERGUNTA_MARCO: Record<JornadaFaseCore, string> = {
  validacao_ideia: "Você já validou seu público-alvo, concorrentes e diferenciais do negócio?",
  planejamento: "Você já tem nome e identidade visual (marca, logo) definidos?",
  formalizacao: "Seu negócio já está formalizado (CNPJ aberto)?",
  financeiro: "Você já fez um planejamento financeiro do negócio (custos, capital de giro)?",
  estrutura: "Você já tem a estrutura básica pronta (local, conta PJ, internet, ferramentas)?",
  fornecedores: "Você já tem fornecedores definidos?",
  produto: "Seu produto ou serviço já está definido e com preço formado?",
  marketing: "Você já tem presença digital (Instagram, Google, WhatsApp Business)?",
  clientes: "Você já definiu uma meta de captação de clientes?",
  primeira_venda: "Você já realizou pelo menos uma venda de verdade?",
  organizacao: "Você já tem uma rotina organizada de gestão (financeiro, documentos, estoque)?",
};

const REGIME_LABEL: Record<RegimeFormalizacao, string> = { mei: "MEI", formal: "Empresa formal" };

type Etapa =
  | { tipo: "nicho" }
  | { tipo: "marco"; fase: JornadaFaseCore }
  | { tipo: "cadastro" };

const ETAPA_NICHO_E_MARCOS: Etapa[] = [{ tipo: "nicho" }, ...FASES_JORNADA.map((fase) => ({ tipo: "marco" as const, fase }))];
const ULTIMA_FASE = FASES_JORNADA[FASES_JORNADA.length - 1];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function inputStyle() {
  return {
    height: 48,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    fontSize: 14,
  };
}

/**
 * Fluxo "já tenho negócio" (SDD-52, PRD §8.3) — porta de entrada alternativa
 * pro empreendedor que não está começando do zero: em vez do diagnóstico de
 * 7 blocos (que existe pra descobrir QUAL negócio abrir), aqui a pessoa
 * confirma o nicho e, marco a marco, o quanto do caminho já percorreu na
 * prática — o motor entra direto na próxima fase pendente, sem repetir o
 * que ela já fez fora do sistema.
 *
 * Tudo em estado local até o cadastro final (última etapa): só criamos
 * sessão/conta/jornada de uma vez no fim, evitando persistência parcial
 * complexa pra um fluxo curto — se a pessoa recarregar no meio, recomeça
 * (mesmo trade-off aceito pra v1, documentado na SDD-52).
 */
export function NegocioExistenteScreen() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [loadingNiches, setLoadingNiches] = useState(true);
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [nicheId, setNicheId] = useState<string | null>(null);
  const [semNicho, setSemNicho] = useState(false);
  const [nichoTexto, setNichoTexto] = useState("");

  const [marcos, setMarcos] = useState<Partial<Record<JornadaFaseCore, boolean>>>({});
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [regime, setRegime] = useState<RegimeFormalizacao | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Quem chega aqui já autenticado de verdade (ex.: conta criada pelo admin,
  // ou veio da bifurcação nova dentro do app, ver JornadaScreen/EscolherNichoScreen)
  // não passa pela etapa de criar conta — ela já existe. `null` = ainda não sabemos.
  const [isLoggedInUser, setIsLoggedInUser] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      // `niches` exige `auth.role() = 'authenticated'` (RLS) — sessão anônima
      // conta como autenticada pro Supabase, mas precisa existir uma antes
      // desta consulta (mesmo `ensureSession` do início do `DiagnosticoScreen`).
      const session = await ensureSession();
      if (!session) {
        setError("Não foi possível iniciar sua sessão.");
        setLoadingNiches(false);
        return;
      }
      setIsLoggedInUser(!isAnonymousSession(session));
      const { data, error: nichesError } = await supabase.from("niches").select("id, nome, categoria").order("categoria").order("nome");
      if (nichesError) setError(nichesError.message);
      setNiches(data ?? []);
      setLoadingNiches(false);
    })();
  }, []);

  // Sessão anônima (ou ainda desconhecida) mantém a etapa de cadastro no
  // final; sessão já real pula direto pra semear a Jornada.
  const ETAPAS: Etapa[] = useMemo(
    () => (isLoggedInUser ? ETAPA_NICHO_E_MARCOS : [...ETAPA_NICHO_E_MARCOS, { tipo: "cadastro" as const }]),
    [isLoggedInUser]
  );

  const etapa = ETAPAS[passo];
  const totalEtapas = ETAPAS.length;
  const progressPct = ((passo + 1) / totalEtapas) * 100;

  function avancar() {
    setError(null);
    setPasso((p) => Math.min(p + 1, totalEtapas - 1));
  }

  function voltar() {
    setError(null);
    setPasso((p) => Math.max(p - 1, 0));
  }

  function confirmarNicho() {
    if (!semNicho && !nicheId) {
      setError("Escolha um nicho ou marque que não encontrou o seu.");
      return;
    }
    if (semNicho && !nichoTexto.trim()) {
      setError("Descreva em poucas palavras o seu negócio.");
      return;
    }
    avancar();
  }

  // Última fase e sem etapa de cadastro depois (usuário já logado): não tem
  // pra onde `avancar()` ir — precisa finalizar direto.
  function avancarOuFinalizar(fase: JornadaFaseCore) {
    if (isLoggedInUser && fase === ULTIMA_FASE) {
      handleFinalizarLogado();
      return;
    }
    avancar();
  }

  function confirmarMarco(fase: JornadaFaseCore, confirmado: boolean) {
    setMarcos((m) => ({ ...m, [fase]: confirmado }));
    if (!confirmado) {
      avancarOuFinalizar(fase);
      return;
    }
    if (fase === "planejamento" || fase === "formalizacao") return; // aguarda o campo obrigatório antes de avançar
    avancarOuFinalizar(fase);
  }

  function confirmarSubcampoMarco() {
    setError(null);
    if (etapa.tipo !== "marco") return;
    if (etapa.fase === "planejamento" && !nomeEmpresa.trim()) {
      setError("Qual o nome da sua empresa?");
      return;
    }
    if (etapa.fase === "formalizacao" && !regime) {
      setError("Selecione o regime da sua empresa.");
      return;
    }
    avancarOuFinalizar(etapa.fase);
  }

  /** Compartilhado pelos dois finais possíveis (conta nova vs. usuário já logado). */
  async function semearJornadaESeguir(userId: string) {
    const fasesConcluidas = FASES_JORNADA.filter((fase) => marcos[fase]);
    await startJornadaComProgresso({
      userId,
      nicheId: semNicho ? null : nicheId,
      nichoPersonalizado: semNicho ? nichoTexto.trim() : null,
      fasesConcluidas,
      nomeEmpresa: marcos.planejamento ? nomeEmpresa.trim() : undefined,
      regimeFormalizacao: marcos.formalizacao && regime ? regime : undefined,
    });
    router.replace("/inicio");
  }

  async function handleFinalizar() {
    setError(null);
    if (!nome.trim()) return setError("Como podemos te chamar?");
    if (!isValidEmail(email)) return setError("Digite um e-mail válido.");
    if (senha.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (senha !== confirmarSenha) return setError("As senhas não conferem.");

    setSaving(true);
    try {
      const session = await ensureSession();
      const anonymous = isAnonymousSession(session);

      if (anonymous) {
        const { error: updateError } = await supabase.auth.updateUser({ email, password: senha });
        if (updateError) throw updateError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password: senha });
        if (signUpError) throw signUpError;
      }

      const currentSession = await ensureSession();
      if (!currentSession) throw new Error("Sessão perdida — tenta de novo.");

      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ nome: nome.trim(), onboarding_status: "diagnostico_concluido" })
        .eq("id", currentSession.user.id);
      if (userUpdateError) throw userUpdateError;

      await semearJornadaESeguir(currentSession.user.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Fim do caminho pra quem já tem conta de verdade (SDD-67) — a etapa de
   * cadastro nem existe em `ETAPAS` pra este caso. Sem criar/alterar
   * credencial nenhuma: a conta já existe, só falta semear a Jornada com o
   * progresso confirmado marco a marco.
   */
  async function handleFinalizarLogado() {
    setError(null);
    setSaving(true);
    try {
      const session = await getCurrentSession();
      if (!session) throw new Error("Sessão perdida — faça login de novo.");
      await semearJornadaESeguir(session.user.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <EntrepreneurBackground photoUrl={BACKGROUND_PHOTO.url} />
      <ScrollView style={{ flex: 1, backgroundColor: "transparent" }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space[5], paddingTop: space[6], paddingBottom: space[4] }}>
          <Logo size={28} />
          <Pressable onPress={() => router.replace("/")} accessibilityRole="link" style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>← Início</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: space[4], paddingBottom: space[10] }}>
          <View style={{ width: "100%", maxWidth: 560 }}>
            <View
              style={{
                backgroundColor: color.bg.surface,
                borderRadius: radius.lg,
                padding: space[6],
                shadowColor: "#111827",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Text style={{ ...type.overline, color: color.text.muted, marginBottom: space[2] }}>
                PASSO {passo + 1} DE {totalEtapas}
              </Text>
              <View style={{ height: 8, borderRadius: radius.full, backgroundColor: color.border.default, overflow: "hidden", marginBottom: space[5] }}>
                <View style={{ width: `${progressPct}%`, height: "100%", backgroundColor: color.action.primary, borderRadius: radius.full }} />
              </View>

              {etapa.tipo === "nicho" ? (
                <NichoStep
                  loading={loadingNiches}
                  niches={niches}
                  nicheId={nicheId}
                  onSelect={(id) => {
                    setNicheId(id);
                    setSemNicho(false);
                  }}
                  semNicho={semNicho}
                  onToggleSemNicho={() => {
                    setSemNicho((v) => !v);
                    setNicheId(null);
                  }}
                  nichoTexto={nichoTexto}
                  onChangeNichoTexto={setNichoTexto}
                  onContinuar={confirmarNicho}
                  error={error}
                />
              ) : null}

              {etapa.tipo === "marco" ? (
                <MarcoStep
                  fase={etapa.fase}
                  respondido={marcos[etapa.fase]}
                  onResponder={(v) => confirmarMarco(etapa.fase, v)}
                  saving={saving}
                  nomeEmpresa={nomeEmpresa}
                  onChangeNomeEmpresa={setNomeEmpresa}
                  regime={regime}
                  onChangeRegime={setRegime}
                  onContinuarSubcampo={confirmarSubcampoMarco}
                  onVoltar={voltar}
                  error={error}
                />
              ) : null}

              {etapa.tipo === "cadastro" ? (
                <CadastroStep
                  nome={nome}
                  onChangeNome={setNome}
                  email={email}
                  onChangeEmail={setEmail}
                  senha={senha}
                  onChangeSenha={setSenha}
                  confirmarSenha={confirmarSenha}
                  onChangeConfirmarSenha={setConfirmarSenha}
                  saving={saving}
                  error={error}
                  onSubmit={handleFinalizar}
                  onVoltar={voltar}
                />
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function NichoStep({
  loading,
  niches,
  nicheId,
  onSelect,
  semNicho,
  onToggleSemNicho,
  nichoTexto,
  onChangeNichoTexto,
  onContinuar,
  error,
}: {
  loading: boolean;
  niches: NicheOption[];
  nicheId: string | null;
  onSelect: (id: string) => void;
  semNicho: boolean;
  onToggleSemNicho: () => void;
  nichoTexto: string;
  onChangeNichoTexto: (v: string) => void;
  onContinuar: () => void;
  error: string | null;
}) {
  return (
    <View>
      <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Qual desses mais parece com o seu negócio?</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
        Isso ajuda a personalizar o restante da sua jornada — se o seu não estiver na lista, você pode descrever com suas palavras.
      </Text>

      {loading ? (
        <Text style={{ ...type.body, color: color.text.muted }}>Carregando...</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] }}>
          {niches.map((n) => {
            const selected = !semNicho && nicheId === n.id;
            return (
              <Pressable key={n.id} onPress={() => onSelect(n.id)} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
                <View
                  style={{
                    paddingHorizontal: space[4],
                    paddingVertical: space[2],
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: selected ? color.action.primary : color.border.default,
                    backgroundColor: selected ? color.action.primarySubtle : color.bg.surface,
                  }}
                >
                  <Text style={{ ...type.body, fontWeight: selected ? "700" : "400", color: selected ? "#8A5B06" : color.text.secondary }}>{n.nome}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable onPress={onToggleSemNicho} style={{ minHeight: 44, justifyContent: "center", marginBottom: space[3] }}>
        <Text style={{ ...type.bodyStrong, color: color.action.secondary }}>
          {semNicho ? "✓ Não encontrei o meu negócio na lista" : "Não encontrei o meu negócio na lista"}
        </Text>
      </Pressable>

      {semNicho ? (
        <TextInput
          value={nichoTexto}
          onChangeText={onChangeNichoTexto}
          placeholder="Descreva seu negócio em poucas palavras"
          style={{ ...inputStyle(), marginBottom: space[4] }}
        />
      ) : null}

      {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

      <Button label="Continuar" variant="secondary" fullWidth onPress={onContinuar} />
    </View>
  );
}

function MarcoStep({
  fase,
  respondido,
  onResponder,
  saving,
  nomeEmpresa,
  onChangeNomeEmpresa,
  regime,
  onChangeRegime,
  onContinuarSubcampo,
  onVoltar,
  error,
}: {
  fase: JornadaFaseCore;
  respondido: boolean | undefined;
  onResponder: (v: boolean) => void;
  saving: boolean;
  nomeEmpresa: string;
  onChangeNomeEmpresa: (v: string) => void;
  regime: RegimeFormalizacao | null;
  onChangeRegime: (v: RegimeFormalizacao) => void;
  onContinuarSubcampo: () => void;
  onVoltar: () => void;
  error: string | null;
}) {
  const precisaSubcampo = (fase === "planejamento" || fase === "formalizacao") && respondido === true;

  return (
    <View>
      <Text style={{ ...type.overline, color: color.action.primaryHover, marginBottom: space[2] }}>{FASE_JORNADA_LABEL[fase].toUpperCase()}</Text>
      <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[5] }}>{PERGUNTA_MARCO[fase]}</Text>

      <View style={{ flexDirection: "row", gap: space[3], marginBottom: space[5] }}>
        <Button
          label="Sim"
          variant={respondido === true ? "primary" : "outline"}
          loading={saving && respondido === true}
          disabled={saving}
          onPress={() => onResponder(true)}
          style={{ flex: 1 }}
        />
        <Button
          label="Não"
          variant={respondido === false ? "primary" : "outline"}
          loading={saving && respondido === false}
          disabled={saving}
          onPress={() => onResponder(false)}
          style={{ flex: 1 }}
        />
      </View>

      {precisaSubcampo && fase === "planejamento" ? (
        <TextInput
          value={nomeEmpresa}
          onChangeText={onChangeNomeEmpresa}
          placeholder="Nome da sua empresa"
          style={{ ...inputStyle(), marginBottom: space[4] }}
        />
      ) : null}

      {precisaSubcampo && fase === "formalizacao" ? (
        <View style={{ flexDirection: "row", gap: space[3], marginBottom: space[4] }}>
          {(["mei", "formal"] as RegimeFormalizacao[]).map((r) => (
            <Button key={r} label={REGIME_LABEL[r]} variant={regime === r ? "primary" : "outline"} onPress={() => onChangeRegime(r)} style={{ flex: 1 }} />
          ))}
        </View>
      ) : null}

      {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

      <View style={{ flexDirection: "row", gap: space[3] }}>
        <Button label="Voltar" variant="ghost" onPress={onVoltar} disabled={saving} />
        {precisaSubcampo ? (
          <Button label={saving ? "Salvando..." : "Continuar"} variant="secondary" loading={saving} onPress={onContinuarSubcampo} style={{ flex: 1 }} />
        ) : null}
      </View>
    </View>
  );
}

function CadastroStep({
  nome,
  onChangeNome,
  email,
  onChangeEmail,
  senha,
  onChangeSenha,
  confirmarSenha,
  onChangeConfirmarSenha,
  saving,
  error,
  onSubmit,
  onVoltar,
}: {
  nome: string;
  onChangeNome: (v: string) => void;
  email: string;
  onChangeEmail: (v: string) => void;
  senha: string;
  onChangeSenha: (v: string) => void;
  confirmarSenha: string;
  onChangeConfirmarSenha: (v: string) => void;
  saving: boolean;
  error: string | null;
  onSubmit: () => void;
  onVoltar: () => void;
}) {
  return (
    <View>
      <Text style={{ ...type.h2, color: color.text.primary, marginBottom: space[1] }}>Criar minha conta</Text>
      <Text style={{ ...type.body, color: color.text.secondary, marginBottom: space[5] }}>
        Já sabemos de onde você está partindo — assim que criar a conta, sua Jornada já começa no ponto certo.
      </Text>

      <View style={{ marginBottom: space[4] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Nome</Text>
        <TextInput value={nome} onChangeText={onChangeNome} placeholder="Como podemos te chamar?" style={inputStyle()} />
      </View>
      <View style={{ marginBottom: space[4] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>E-mail</Text>
        <TextInput value={email} onChangeText={onChangeEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" style={inputStyle()} />
      </View>
      <View style={{ marginBottom: space[4] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Senha</Text>
        <TextInput value={senha} onChangeText={onChangeSenha} placeholder="Mínimo 6 caracteres" secureTextEntry style={inputStyle()} />
      </View>
      <View style={{ marginBottom: space[4] }}>
        <Text style={{ ...type.bodyStrong, color: color.text.primary, marginBottom: space[1] }}>Confirmar senha</Text>
        <TextInput value={confirmarSenha} onChangeText={onChangeConfirmarSenha} placeholder="Repita a senha" secureTextEntry style={inputStyle()} />
      </View>

      {error ? <Text style={{ ...type.caption, color: color.state.danger, marginBottom: space[3] }}>{error}</Text> : null}

      <View style={{ flexDirection: "row", gap: space[3] }}>
        <Button label="Voltar" variant="ghost" onPress={onVoltar} disabled={saving} />
        <Button label={saving ? "Criando conta..." : "Criar conta e começar"} variant="primary" loading={saving} onPress={onSubmit} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
