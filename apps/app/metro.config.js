const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// SDD-8/SDD-14 (SPEC.md): o .env fica na raiz do monorepo, não em apps/app —
// carrega aqui para que as variáveis EXPO_PUBLIC_* sejam inlined pelo babel-preset-expo.
require("dotenv").config({ path: path.resolve(workspaceRoot, ".env") });

const config = getDefaultConfig(projectRoot);

// Monorepo pnpm — SPEC.md §3: apps/app depende de packages/* via workspace.
// pnpm usa node_modules simbólico por pacote (sem hoist "flat" como yarn/npm
// workspaces) — por isso mantemos a resolução hierárquica padrão do Metro,
// só ampliando o watchFolders para os pacotes do monorepo.
config.watchFolders = [workspaceRoot];

module.exports = config;
