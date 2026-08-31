// Ser Dono — gerador de dados estáticos das páginas "Quanto custa abrir" (SDD-93, docs/SPEC.md).
//
// Por quê ler as migrations em vez do banco: estas páginas são 100% públicas
// e pré-login — não existe sessão para satisfazer a RLS de `public.niches`
// ("niches_read_all" exige `auth.role() = 'authenticated'`, SDD-5). Buscar
// com service_role em build time funcionaria, mas exigiria o segredo do
// banco disponível no pipeline de build do site (Vercel) só para reler um
// dado que já é conteúdo curado e versionado no próprio repositório — as
// migrations SÃO a fonte de verdade deste dado (mesma lógica de
// "conteúdo curado por migration, não por CRUD" já aplicada em SPEC.md
// SDD-61 para as obrigações fiscais). Ler o arquivo-fonte evita duplicar
// segredo e mantém o dado da página idêntico ao dado real do produto,
// sem round-trip de rede no build.
//
// Saída: apps/app/data/quantoCusta.generated.json — importado pelas rotas
// app/quanto-custa/index.tsx e app/quanto-custa/[slug].tsx.
//
// Reexecutar sempre que uma migration nova alterar `public.niches`
// (novo nicho, faixa revisada, fonte atualizada). Rodado automaticamente
// antes de `expo export --platform web` (ver package.json → build:web).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../../supabase/migrations");
const OUT_FILE = path.resolve(__dirname, "../data/quantoCusta.generated.json");

// As duas migrations que fazem `insert into public.niches (...)` com o
// conjunto de colunas usado por estas páginas. Se uma nova migration de
// nicho for criada, adicione o arquivo aqui.
const SOURCE_FILES = [
  "20260728154009_seed_nichos_mvp.sql",
  "20260731200000_expandir_nichos.sql",
  "20260831123625_nichos_baixa_estrutura.sql",
  "20260831162322_nicho_desenvolvimento_software.sql",
];

const COLUMNS = [
  "nome",
  "slug",
  "categoria",
  "investimento_min",
  "investimento_max",
  "tempo_ate_equilibrio_meses",
  "complexidade_regulatoria",
  "sazonalidade",
  "margem_tipica_pct",
  "intensidade_mao_de_obra",
  "dependencia_ponto_fisico",
  "nivel_concorrencia",
  "perfil_cliente",
];

/**
 * Parser deliberadamente simples e específico ao formato real destas duas
 * migrations (values entre parênteses, string simples ou `E'...'`, jsonb
 * inline, booleano, número) — não é um parser de SQL genérico. Se o formato
 * da migration mudar, este parser precisa mudar junto (mesmo acoplamento
 * consciente de outros scripts do projeto que leem SQL diretamente).
 */
function parseInsertBlock(sql, columnsForFile) {
  const rows = [];
  // Cada linha de dado começa com "(" no início da linha (ou logo após vírgula)
  // e termina em "),\n" ou ");\n". Vamos varrer parênteses balanceados.
  let i = 0;
  const valuesIdx = sql.indexOf("values");
  if (valuesIdx === -1) return rows;
  let cursor = valuesIdx + "values".length;

  while (cursor < sql.length) {
    const open = sql.indexOf("(", cursor);
    if (open === -1) break;
    // encontra o fechamento balanceado, respeitando aspas simples e E'...'
    let depth = 0;
    let inStr = false;
    let j = open;
    for (; j < sql.length; j++) {
      const c = sql[j];
      if (inStr) {
        if (c === "'" && sql[j - 1] !== "\\") {
          // '' dentro de string SQL é aspas escapada — verifica par
          if (sql[j + 1] === "'") { j++; continue; }
          inStr = false;
        }
        continue;
      }
      if (c === "'") { inStr = true; continue; }
      if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) break;
      }
    }
    const block = sql.slice(open + 1, j);
    rows.push(splitTopLevel(block).map((f) => f.trim()));
    cursor = j + 1;
    // para no ";" que fecha o insert inteiro
    const semi = sql.indexOf(";", cursor);
    const nextOpen = sql.indexOf("(", cursor);
    if (semi !== -1 && (nextOpen === -1 || semi < nextOpen)) break;
  }
  return rows.map((fields) => {
    const obj = {};
    columnsForFile.forEach((col, idx) => { obj[col] = fields[idx]; });
    return obj;
  });
}

function splitTopLevel(s) {
  const parts = [];
  let depth = 0, inStr = false, cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      cur += c;
      if (c === "'" && s[i + 1] === "'") { cur += s[++i]; continue; }
      if (c === "'") inStr = false;
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function unquote(raw) {
  if (raw == null) return null;
  let v = raw.trim();
  if (v.startsWith("E'")) v = v.slice(2, -1);
  else if (v.startsWith("'")) v = v.slice(1, -1);
  else return v; // número/bool/jsonb cru
  return v.replace(/''/g, "'").replace(/\\n/g, "\n");
}

function toNumber(raw) {
  const v = unquote(raw);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool(raw) {
  const v = unquote(raw)?.toLowerCase?.() ?? raw;
  return v === "true" || v === "t";
}

const all = [];

for (const file of SOURCE_FILES) {
  const full = path.join(MIGRATIONS_DIR, file);
  const sql = readFileSync(full, "utf-8");
  // localiza cada bloco "insert into public.niches (...) values ... ;"
  const insertRegex = /insert into public\.niches\s*\(([\s\S]*?)\)\s*values/;
  const m = sql.match(insertRegex);
  if (!m) { console.warn(`[quanto-custa] nenhum insert em ${file}`); continue; }
  const cols = m[1].split(",").map((c) => c.trim());
  const rows = parseInsertBlock(sql, cols);
  for (const r of rows) {
    all.push({
      nome: unquote(r.nome),
      slug: unquote(r.slug),
      categoria: unquote(r.categoria),
      investimentoMin: toNumber(r.investimento_min),
      investimentoMax: toNumber(r.investimento_max),
      tempoEquilibrioMeses: toNumber(r.tempo_ate_equilibrio_meses),
      margemTipicaPct: toNumber(r.margem_tipica_pct),
      nivelConcorrencia: toNumber(r.nivel_concorrencia),
      dependenciaPontoFisico: toBool(r.dependencia_ponto_fisico),
      perfilCliente: unquote(r.perfil_cliente),
      fonte: unquote(r.fonte) ?? null,
      fonteData: unquote(r.fonte_data) ?? null,
    });
  }
}

// Sanidade: sem slug/nome, ou sem fonte (RN-20 exige fonte visível em todo
// dado de mercado — uma página sem fonte não deve ser publicada), o registro
// é descartado e avisado, em vez de gerar uma página inconsistente.
const clean = [];
for (const n of all) {
  if (!n.slug || !n.nome) { console.warn("[quanto-custa] registro sem slug/nome, descartado", n); continue; }
  if (!n.fonte) { console.warn(`[quanto-custa] "${n.nome}" sem fonte — descartado (RN-20)`); continue; }
  clean.push(n);
}

clean.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

writeFileSync(OUT_FILE, JSON.stringify(clean, null, 2) + "\n", "utf-8");
console.log(`[quanto-custa] ${clean.length} nichos gerados em ${path.relative(process.cwd(), OUT_FILE)}`);
