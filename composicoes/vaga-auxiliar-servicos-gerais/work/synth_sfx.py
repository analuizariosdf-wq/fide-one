"""Efeitos sintetizados do Reel 03 (vaga ASG). Determinístico (semente fixa).
Uso: python3 -I synth_sfx.py <pasta_saida>
"""
import sys, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def place(buf, x, at):
    i = int(at * SR)
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n]


def norm(x, peak=0.85):
    x = x / (np.abs(x).max() + 1e-9) * peak
    f = np.linspace(1, 0, int(0.008 * SR))
    x[-len(f):] *= f
    return x


def bell(f0, d, decay=5.0):
    tt = t(d)
    y = sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt * decay * (1 + r * .3))
            for r, a in ((1, 1), (2.76, .45), (5.4, .2)))
    return y * (1 - np.exp(-tt * 900))


def click(d=0.014, lo=1500, hi=6000, k=380):
    tt = t(d)
    return bp(rng.standard_normal(len(tt)), lo, hi) * np.exp(-tt * k)


# 1) alerta curto e leve: dois "ui-ú" de sirene suave
d = 0.75
tt = t(d)
f = 950 + 380 * np.abs(np.sin(np.pi * tt / 0.375))
y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
y *= np.interp(tt, [0, .03, .7, .75], [0, 1, .8, 0])
sf.write(f"{OUT}/alerta.wav", norm(y, .7), SR)

# 2) carimbo: batida grave + estalo de papel
d = 0.45
tt = t(d)
thud = np.sin(2 * np.pi * (70 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14)
slap = bp(rng.standard_normal(len(tt)), 800, 5000) * np.exp(-tt * 90)
sf.write(f"{OUT}/carimbo.wav", norm(thud + 0.6 * slap), SR)

# 3) máquina de escrever rápida: 16 batidas com espaçamento irregular
buf = np.zeros(int(1.5 * SR))
at = 0.0
for k in range(16):
    place(buf, click(0.02, 1200, 5500, 300) * (0.7 + 0.3 * rng.random()), at)
    place(buf, 0.35 * click(0.008, 3000, 9000, 700), at + 0.006)
    at += 0.06 + 0.035 * rng.random()
sf.write(f"{OUT}/maquina.wav", norm(buf), SR)

# 4) aviãozinho de papel: sopro que sobe com vibração de papel
d = 0.9
tt = t(d)
noise = rng.standard_normal(len(tt))
y = bp(noise, 600, 5000) * np.interp(tt, [0, .35, .9], [0, 1, 0])
y *= 1 + 0.45 * np.sin(2 * np.pi * (22 + 18 * tt) * tt)        # "tremido" do papel
y += 0.15 * np.sin(2 * np.pi * np.cumsum(500 + 900 * tt) / SR) * np.interp(tt, [0, .4, .9], [0, .6, 0])
sf.write(f"{OUT}/aviaozinho.wav", norm(y), SR)

# 5) teclado de celular: tons DTMF de cada dígito do número (31) 97231-7190
DTMF = {"1": (697, 1209), "2": (697, 1336), "3": (697, 1477), "4": (770, 1209), "5": (770, 1336),
        "6": (770, 1477), "7": (852, 1209), "8": (852, 1336), "9": (852, 1477), "0": (941, 1336)}
for dig, (a, b) in DTMF.items():
    tt = t(0.09)
    y = (np.sin(2 * np.pi * a * tt) + np.sin(2 * np.pi * b * tt)) * np.interp(tt, [0, .005, .075, .09], [0, 1, 1, 0])
    y = y * 0.8 + 0.5 * np.pad(click(0.01, 2000, 7000, 600), (0, len(tt) - int(0.01 * SR)))
    sf.write(f"{OUT}/tecla-{dig}.wav", norm(y, .7), SR)

# 6) tique-taque curto terminando num "ding"
buf = np.zeros(int(2.2 * SR))
for k in range(4):
    place(buf, click(0.025, 2600 if k % 2 == 0 else 1700, 6000 if k % 2 == 0 else 4000, 220), k * 0.33)
place(buf, 1.2 * (bell(1568, 1.1, 3.2) + 0.6 * bell(2349, 1.1, 3.5)), 4 * 0.33)
sf.write(f"{OUT}/tique-taque-ding.wav", norm(buf), SR)
print("ok")
