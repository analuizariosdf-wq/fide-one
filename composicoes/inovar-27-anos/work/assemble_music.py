"""Monta a trilha de reserva no tempo do vídeo: piano (trecho limpo da geração longa) em laço até
os números da equipe, depois o trecho orquestral, com o pico caindo no "27 anos de Inovar é…".
Uso: python3 -I assemble_music.py <projeto> <orquestra.wav> <saida.wav>"""
import json, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

P, ORCH, OUT = sys.argv[1:4]
SR = 48000
T = json.load(open(f"{P}/work/timeline.json"))
END = T["end"]


def read(path):
    x, sr = sf.read(path)
    if x.ndim > 1:
        x = x.mean(1)
    return resample_poly(x, SR, sr) if sr != SR else x


def rms(x):
    return np.sqrt((x ** 2).mean()) + 1e-9


piano = read(f"{P}/work/music/reserva-s3.wav")[: int(48.5 * SR)]      # depois de 49 s a geração degrada
orch = read(ORCH)
piano /= rms(piano[int(5 * SR):])
orch /= rms(orch)
XF = int(3.0 * SR)


def xfade(a, b, n=XF):
    f = np.linspace(0, 1, n)
    return np.concatenate([a[:-n], a[-n:] * np.sqrt(1 - f) + b[:n] * np.sqrt(f), b[n:]])


# piano: 0–48,5 s e depois de novo a partir de 6 s (laço com fusão de 3 s)
bed = xfade(piano, piano[int(6 * SR):])
ORCH_IN = END - len(orch) / SR + 0.2              # orquestra termina junto com o vídeo (entra nos números da equipe)
i = int(ORCH_IN * SR)
need = int(END * SR) - i
o = orch[:need] if len(orch) >= need else np.concatenate([orch, np.zeros(need - len(orch))])
o = o * 1.25                                       # um pouco mais presente que o piano
music = xfade(bed[: i + XF], o, XF) if len(bed) >= i + XF else None
music = music[: int(END * SR)]
music = music / np.abs(music).max() * 0.9
sf.write(OUT, music.astype(np.float32), SR)
print("ok", len(music) / SR, "orquestra entra em", round(ORCH_IN, 2))
