import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { getCurrentSession, listMyPushTokens, registerPushToken, removePushToken } from "@serdono/supabase";

/**
 * Opt-in de avisos no celular (pedido do dono do produto, 08/08/2026) — só
 * existe no app instalado (`Platform.OS !== "web"`); web não tem push nativo
 * aqui. Precisa de aparelho de verdade (`Device.isDevice`) — emulador/Expo
 * Go em alguns casos não recebe token válido da Expo.
 */
export function usePushNotifications() {
  const suportado = Platform.OS !== "web";
  const [userId, setUserId] = useState<string | null>(null);
  const [ativado, setAtivado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!suportado) {
      setCarregando(false);
      return;
    }
    (async () => {
      try {
        const session = await getCurrentSession();
        if (!session) return;
        setUserId(session.user.id);
        const tokens = await listMyPushTokens(session.user.id);
        setAtivado(tokens.length > 0);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setCarregando(false);
      }
    })();
  }, [suportado]);

  async function ativar() {
    if (!userId) return;
    setProcessando(true);
    setError(null);
    try {
      if (!Device.isDevice) {
        throw new Error("Avisos só funcionam num aparelho de verdade, não no emulador.");
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Avisos do Ser Dono",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const permissaoAtual = await Notifications.getPermissionsAsync();
      let status = permissaoAtual.status;
      if (status !== "granted") {
        const pedida = await Notifications.requestPermissionsAsync();
        status = pedida.status;
      }
      if (status !== "granted") {
        throw new Error("Sem permissão de notificação — ative nas configurações do aparelho pra receber avisos.");
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      await registerPushToken(userId, token, Platform.OS as "android" | "ios");
      setAtivado(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  async function desativar() {
    if (!userId) return;
    setProcessando(true);
    setError(null);
    try {
      const tokens = await listMyPushTokens(userId);
      await Promise.all(tokens.map((t) => removePushToken(t.expo_push_token)));
      setAtivado(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  return { suportado, ativado, carregando, processando, error, ativar, desativar };
}
