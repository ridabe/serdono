import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { color, radius, space, type } from "@serdono/ui";

// Contador de escassez da landing do e-book (SDD-139, pedido do dono do
// produto). É proposital que ele SEMPRE mostre "faltam algumas horas": a
// janela é curta (3–7h) e, se zerar durante a visita, reinicia — nunca chega
// a 00:00:00. Cada visitante tem o próprio prazo (guardado no navegador),
// então não é um relógio global de verdade.

const JANELA_MIN_H = 3;
const JANELA_MAX_H = 7;
const STORAGE_KEY = "serdono_ebook_deadline_v1";

function novoPrazo(): number {
  const horas = JANELA_MIN_H + Math.random() * (JANELA_MAX_H - JANELA_MIN_H);
  return Date.now() + horas * 3_600_000;
}

/** Fallback pra quando não há localStorage (app nativo, aba privada com storage bloqueado). */
let prazoEmMemoria: number | null = null;

function lerPrazo(): number {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const salvo = Number(window.localStorage.getItem(STORAGE_KEY));
      if (salvo && salvo > Date.now()) return salvo;
      const novo = novoPrazo();
      window.localStorage.setItem(STORAGE_KEY, String(novo));
      return novo;
    }
  } catch {
    // storage indisponível — cai no de memória
  }
  if (!prazoEmMemoria || prazoEmMemoria <= Date.now()) prazoEmMemoria = novoPrazo();
  return prazoEmMemoria;
}

function renovarPrazo(): number {
  const novo = novoPrazo();
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, String(novo));
    }
  } catch {
    /* ignore */
  }
  prazoEmMemoria = novo;
  return novo;
}

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function EbookCountdown({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  const prazoRef = useRef<number>(lerPrazo());
  const [restante, setRestante] = useState<number>(prazoRef.current - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      let ms = prazoRef.current - Date.now();
      if (ms <= 0) {
        prazoRef.current = renovarPrazo();
        ms = prazoRef.current - Date.now();
      }
      setRestante(ms);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const totalSeg = Math.max(0, Math.floor(restante / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;

  const labelColor = onDark ? "#C7D3E3" : color.text.secondary;
  const boxBg = onDark ? "rgba(255,255,255,0.12)" : color.bg.brand;
  const boxFg = onDark ? color.text.onBrand : color.text.onBrand;

  const blocos: { valor: string; rotulo: string }[] = [
    { valor: pad(h), rotulo: "horas" },
    { valor: pad(m), rotulo: "min" },
    { valor: pad(s), rotulo: "seg" },
  ];

  return (
    <View style={{ alignItems: compact ? "center" : "flex-start", gap: space[2] }}>
      <Text style={{ ...type.overline, color: onDark ? color.action.primary : color.action.primaryHover }}>
        A VERSÃO GRATUITA SAI DO AR EM
      </Text>
      <View style={{ flexDirection: "row", gap: space[2] }}>
        {blocos.map((b, i) => (
          <React.Fragment key={b.rotulo}>
            <View
              style={{
                backgroundColor: boxBg,
                borderRadius: radius.md,
                paddingVertical: space[2],
                paddingHorizontal: compact ? space[3] : space[4],
                alignItems: "center",
                minWidth: compact ? 52 : 64,
              }}
            >
              <Text
                style={{
                  fontFamily: type.display.fontFamily,
                  fontSize: compact ? 24 : 30,
                  lineHeight: compact ? 30 : 36,
                  color: boxFg,
                }}
              >
                {b.valor}
              </Text>
              <Text style={{ ...type.caption, color: onDark ? "#8FA3BC" : color.bg.brandSubtle }}>{b.rotulo}</Text>
            </View>
            {i < blocos.length - 1 ? (
              <Text style={{ fontFamily: type.display.fontFamily, fontSize: compact ? 24 : 30, color: labelColor, alignSelf: "center" }}>
                :
              </Text>
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
