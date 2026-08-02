import { isNativeApp } from "@serdono/ui";
import { HomeScreen } from "../components/home/HomeScreen";
import { AppWelcomeScreen } from "../components/boasVindas/AppWelcomeScreen";

// Única bifurcação de tela por plataforma do produto (SDD-53): no navegador
// a raiz é a landing de venda; no app instalado é a tela de boas-vindas.
// Tudo depois daqui (cadastro, login, jornada) é a mesma tela nos dois.
export default function Index() {
  return isNativeApp ? <AppWelcomeScreen /> : <HomeScreen />;
}
