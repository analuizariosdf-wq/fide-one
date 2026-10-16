"""Sintetiza os efeitos que não existem no banco do projeto (Pixabay):
caixa registradora / contador, cha-ching e mergulho na água. Determinístico (semente fixa).
Uso: python3 -I synth_sfx.py <pasta_saida>
"""
import sys, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(42)


def t(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def bell(f0, d, partials=((1, 1.0), (2.76, .5), (5.4, .25), (8.9, .12)), decay=5.0):
    tt = t(d)
    y = sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt * decay * (1 + r * .35)) for r, a in partials)
    return y * (1 - np.exp(-tt * 900))


def click(d=0.012, lo=1800, hi=7000):
    tt = t(d)
    return bp(rng.standard_normal(len(tt)), lo, hi) * np.exp(-tt * 420)


def place(buf, x, at):
    i = int(at * SR)
    buf[i:i + len(x)] += x[: max(0, len(buf) - i)]


def norm(x, peak=0.85):
    x = x / (np.abs(x).max() + 1e-9) * peak
    fade = np.linspace(1, 0, int(0.01 * SR))
    x[-len(fade):] *= fade
    return x


# 1) contador de dinheiro / caixa registradora: catraca acelera e freia, termina num "ching"
buf = np.zeros(int(1.6 * SR))
gaps = np.concatenate([np.linspace(0.075, 0.03, 9), np.full(8, 0.03), np.linspace(0.035, 0.08, 6)])
at = 0.0
for k, g in enumerate(gaps):
    place(buf, click() * (0.6 + 0.4 * rng.random()), at)
    place(buf, 0.25 * bell(1900 + 40 * (k % 3), 0.05, decay=60), at)
    at += g
place(buf, 0.9 * bell(2637, 0.9) + 0.6 * bell(3951, 0.9), at + 0.02)
sf.write(f"{OUT}/contador-caixa.wav", norm(buf), SR)

# 2) cha-ching: "cha" (ruído metálico curto) + "ching" (sino brilhante)
buf = np.zeros(int(1.0 * SR))
tt = t(0.09)
cha = bp(rng.standard_normal(len(tt)), 3500, 9000) * np.exp(-tt * 45) * (1 - np.exp(-tt * 600))
place(buf, 0.8 * cha, 0.0)
place(buf, bell(2637, 0.85, decay=4.0) + 0.7 * bell(3520, 0.85, decay=4.5) + 0.35 * bell(5274, 0.85, decay=6), 0.085)
sf.write(f"{OUT}/cha-ching.wav", norm(buf), SR)

# 3) mergulho na água: varredura de ruído descendo + bolhas subindo
d = 1.3
tt = t(d)
noise = rng.standard_normal(len(tt))
env = np.interp(tt, [0, 0.12, 0.35, 1.3], [0, 1, 0.7, 0])
cut = np.interp(tt, [0, 0.35, 1.3], [7000, 900, 250])
y = np.zeros_like(noise)
blk = 960
for s in range(0, len(noise), blk):          # passa-baixas variando no tempo, em blocos de 20 ms
    seg = noise[max(0, s - 2048): s + blk]
    y[s:s + blk] = lp(seg, cut[s], order=2)[-len(noise[s:s + blk]):]
y *= env
for k in range(14):                          # bolhas: chirps curtos subindo
    st = 0.28 + rng.random() * 0.85
    dd = 0.025 + rng.random() * 0.03
    tb = t(dd)
    f = np.linspace(280 + rng.random() * 300, 900 + rng.random() * 600, len(tb))
    b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(len(tb)) * (0.25 + 0.3 * rng.random())
    place(y, b, st)
sf.write(f"{OUT}/mergulho.wav", norm(y), SR)
print("ok")
