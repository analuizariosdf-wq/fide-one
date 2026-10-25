// Biblioteca reutilizável dos vídeos do Daniel: legenda, títulos, cards,
// versículo, B-roll, punch-in e CTA. Tempos sempre em segundos.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { cor, fonte } from "./marca";

export type Palavra = {
  text: string;
  start: number;
  end: number;
  destaque?: "serif" | "coral";
};

const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

// Entra com escala e deslize a partir de `t` (segundos).
export const entrada = (agora: number, t: number, dur = 0.22) =>
  interpolate(agora, [t - 0.03, t - 0.03 + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

export const fade = (agora: number, inicio: number, fim: number, d = 0.2) =>
  Math.min(
    interpolate(agora, [inicio, inicio + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(agora, [fim - d, fim], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );

// ---------- Vídeo da fala com punch-in alternado ----------
export const FalaComPunchIn: React.FC<{
  src: string;
  cortes: { t: number; escala: number }[];
  origemY?: string;
}> = ({ src, cortes, origemY = "30%" }) => {
  const agora = useTempo();
  let escala = 1;
  for (const c of cortes) if (agora >= c.t) escala = c.escala;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: cor.preto }}>
      <AbsoluteFill style={{ transform: `scale(${escala})`, transformOrigin: `50% ${origemY}` }}>
        <OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- B-roll em tela cheia ----------
export const BRoll: React.FC<{ src: string; inicio: number; fim: number }> = ({ src, inicio, fim }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(inicio * fps)} durationInFrames={Math.round((fim - inicio) * fps)}>
      <BRollInterno src={src} dur={fim - inicio} />
    </Sequence>
  );
};

const BRollInterno: React.FC<{ src: string; dur: number }> = ({ src, dur }) => {
  const agora = useTempo();
  const zoom = interpolate(agora, [0, dur], [1.1, 1.0], { easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: cor.preto }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }}
      />
    </AbsoluteFill>
  );
};

// ---------- Legenda palavra por palavra ----------
type Grupo = { palavras: Palavra[]; inicio: number; fim: number };

export const agruparPalavras = (palavras: Palavra[], max = 4): Grupo[] => {
  const grupos: Grupo[] = [];
  let atual: Palavra[] = [];
  palavras.forEach((p, i) => {
    atual.push(p);
    const prox = palavras[i + 1];
    const pontuacao = /[.,!?;:]$/.test(p.text);
    const pausa = prox ? prox.start - p.end > 0.35 : true;
    if (atual.length >= max || pontuacao || pausa || !prox) {
      grupos.push({ palavras: atual, inicio: atual[0].start, fim: p.end });
      atual = [];
    }
  });
  grupos.forEach((g, i) => {
    const prox = grupos[i + 1];
    g.fim = prox ? Math.min(prox.inicio, g.fim + 0.6) : g.fim + 0.5;
  });
  return grupos;
};

export const Legenda: React.FC<{
  palavras: Palavra[];
  ocultar: [number, number][];
  y?: number;
}> = ({ palavras, ocultar, y = 1330 }) => {
  const agora = useTempo();
  const grupos = React.useMemo(() => agruparPalavras(palavras), [palavras]);
  if (ocultar.some(([a, b]) => agora >= a && agora < b)) return null;
  const g = grupos.find((x) => agora >= x.inicio - 0.05 && agora < x.fim);
  if (!g) return null;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: y,
          left: 110,
          width: 840,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          columnGap: 18,
          rowGap: 0,
          textAlign: "center",
        }}
      >
        {g.palavras.map((p, i) => {
          const dita = agora >= p.start - 0.03;
          const k = entrada(agora, p.start, 0.14);
          const serif = p.destaque === "serif";
          return (
            <span
              key={i}
              style={{
                fontFamily: serif ? fonte.serif : fonte.base,
                fontStyle: serif ? "italic" : "normal",
                fontWeight: serif ? 400 : 800,
                fontSize: serif ? 92 : 68,
                lineHeight: 1.12,
                color: serif ? cor.dourado : p.destaque === "coral" ? cor.coral : cor.offWhite,
                opacity: dita ? 1 : 0.35,
                transform: `scale(${dita ? 0.88 + 0.12 * k : 1})`,
                display: "inline-block",
                textShadow: "0 4px 18px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)",
                letterSpacing: serif ? 0 : -0.5,
              }}
            >
              {p.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Linha de título com entrada por máscara ----------
export const LinhaTitulo: React.FC<{
  texto: string;
  t: number;
  tamanho: number;
  familia?: "impacto" | "serif" | "base";
  corTexto?: string;
  saida?: number;
  riscar?: number; // tempo em que aparece o risco
}> = ({ texto, t, tamanho, familia = "impacto", corTexto = cor.offWhite, saida, riscar }) => {
  const agora = useTempo();
  const k = entrada(agora, t, 0.26);
  const out = saida ? interpolate(agora, [saida, saida + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) }) : 0;
  const risco = riscar ? entrada(agora, riscar, 0.25) : 0;
  const serif = familia === "serif";
  return (
    <div style={{ overflow: "hidden", padding: `${Math.round(tamanho * 0.16)}px 10px 0`, marginTop: -Math.round(tamanho * 0.16), position: "relative" }}>
      <div
        style={{
          fontFamily: fonte[familia],
          fontStyle: serif ? "italic" : "normal",
          fontWeight: familia === "base" ? 800 : 400,
          fontSize: tamanho,
          lineHeight: serif ? 1.05 : 1.0,
          color: corTexto,
          textTransform: familia === "impacto" ? "uppercase" : "none",
          letterSpacing: familia === "base" ? 6 : familia === "impacto" ? 1 : 0,
          transform: `translateY(${(1 - k) * 100 - out * 120}%) scale(${1.08 - 0.08 * k})`,
          opacity: (agora < t - 0.04 ? 0 : 1) * (1 - out),
          textShadow: "0 6px 30px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
          textAlign: "center",
          position: "relative",
        }}
      >
        {texto}
        {riscar ? (
          <div
            style={{
              position: "absolute",
              left: "-3%",
              top: "52%",
              height: Math.max(8, tamanho * 0.07),
              width: `${106 * risco}%`,
              background: cor.coral,
              borderRadius: 4,
              transform: "rotate(-3deg)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// ---------- Fundo escurecido / tela preta ----------
export const Escurecer: React.FC<{ inicio: number; fim: number; opacidade: number; d?: number }> = ({
  inicio,
  fim,
  opacidade,
  d = 0.2,
}) => {
  const agora = useTempo();
  const o = fade(agora, inicio, fim, d) * opacidade;
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: cor.preto,
        opacity: o,
        backgroundImage: "radial-gradient(ellipse at 50% 120%, rgba(201,164,92,0.18), rgba(0,0,0,0) 60%)",
      }}
    />
  );
};

export const Bloco: React.FC<{
  inicio: number;
  fim: number;
  top: number;
  children: React.ReactNode;
  gap?: number;
}> = ({ inicio, fim, top, children, gap = 6 }) => {
  const agora = useTempo();
  if (agora < inicio - 0.1 || agora >= fim) return null;
  const o = interpolate(agora, [fim - 0.2, fim], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div
        style={{
          position: "absolute",
          top,
          left: 60,
          width: 960,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Versículo palavra por palavra ----------
export const Versiculo: React.FC<{
  inicio: number;
  fim: number;
  referencia: string; // ex.: "MATEUS 6:33 · NVI"
  palavras: Palavra[];
  top?: number;
}> = ({ inicio, fim, referencia, palavras, top = 640 }) => {
  const agora = useTempo();
  if (agora < inicio || agora >= fim) return null;
  const o = fade(agora, inicio, fim, 0.25);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", top, left: 110, width: 860, textAlign: "center" }}>
        <div
          style={{
            fontFamily: fonte.base,
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: 8,
            color: cor.dourado,
            marginBottom: 44,
            opacity: entrada(agora, inicio + 0.1, 0.4),
          }}
        >
          {referencia}
        </div>
        <div style={{ fontFamily: fonte.serif, fontStyle: "italic", fontSize: 80, lineHeight: 1.14 }}>
          {palavras.map((p, i) => {
            const k = interpolate(agora, [p.start - 0.05, p.start + 0.25], [0.15, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  color: p.destaque === "serif" ? cor.dourado : cor.offWhite,
                  opacity: k,
                  filter: `blur(${(1 - k) * 6}px)`,
                }}
              >
                {p.text}{" "}
              </span>
            );
          })}
        </div>
        <div
          style={{
            margin: "48px auto 0",
            width: interpolate(agora, [inicio + 0.2, inicio + 1.2], [0, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            height: 2,
            background: cor.dourado,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Assinatura no rodapé das telas de motion ----------
export const Assinatura: React.FC<{ janelas: [number, number][] }> = ({ janelas }) => {
  const agora = useTempo();
  const j = janelas.find(([a, b]) => agora >= a && agora < b);
  if (!j) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 1590,
        width: "100%",
        textAlign: "center",
        fontFamily: fonte.base,
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: 6,
        color: cor.offWhite,
        opacity: 0.55 * fade(agora, j[0], j[1], 0.25),
      }}
    >
      @DANOLIVEIRAALMEIDA
    </div>
  );
};

// ---------- CTA final ----------
export const CTA: React.FC<{ inicio: number; fim: number; frase: string; chamada: string }> = ({
  inicio,
  fim,
  frase,
  chamada,
}) => {
  const agora = useTempo();
  if (agora < inicio) return null;
  const k1 = entrada(agora, inicio, 0.35);
  const k2 = entrada(agora, inicio + 0.35, 0.35);
  const k3 = entrada(agora, inicio + 0.7, 0.35);
  const o = interpolate(agora, [fim - 0.15, fim], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,14,14,0) 45%, rgba(14,14,14,0.85) 75%)", opacity: k1 }} />
      <div style={{ position: "absolute", top: 1170, left: 90, width: 870, textAlign: "center" }}>
        <div style={{ fontFamily: fonte.serif, fontStyle: "italic", fontSize: 84, color: cor.dourado, opacity: k1, transform: `translateY(${(1 - k1) * 30}px)` }}>
          {frase}
        </div>
        <div style={{ fontFamily: fonte.base, fontWeight: 800, fontSize: 38, color: cor.offWhite, marginTop: 26, letterSpacing: 1, opacity: k2, transform: `translateY(${(1 - k2) * 30}px)` }}>
          {chamada}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 34, opacity: k3, transform: `scale(${0.9 + 0.1 * k3})` }}>
          <div style={{ background: cor.dourado, color: cor.preto, fontFamily: fonte.base, fontWeight: 800, fontSize: 34, padding: "16px 34px", borderRadius: 40 }}>
            + SEGUIR
          </div>
          <div style={{ border: `2px solid ${cor.offWhite}`, color: cor.offWhite, fontFamily: fonte.base, fontWeight: 600, fontSize: 30, padding: "16px 28px", borderRadius: 40, letterSpacing: 2 }}>
            @DANOLIVEIRAALMEIDA
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
