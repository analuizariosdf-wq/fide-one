import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

// Carrega as fontes da pasta public/fontes do projeto antes de renderizar.
const arquivos: [string, string, string, string][] = [
  ["Anton", "fontes/Anton.ttf", "normal", "400"],
  ["Instrument Serif", "fontes/InstrumentSerif.ttf", "normal", "400"],
  ["Instrument Serif", "fontes/InstrumentSerif-Italic.ttf", "italic", "400"],
  ["Inter", "fontes/Inter-400.ttf", "normal", "400"],
  ["Inter", "fontes/Inter-600.ttf", "normal", "600"],
  ["Inter", "fontes/Inter-800.ttf", "normal", "800"],
];

export const useFontes = () => {
  const [handle] = useState(() => delayRender("fontes"));
  useEffect(() => {
    Promise.all(
      arquivos.map(([familia, arquivo, style, weight]) => {
        const f = new FontFace(familia, `url(${staticFile(arquivo)})`, { style, weight });
        return f.load().then((loaded) => document.fonts.add(loaded));
      }),
    )
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
};
