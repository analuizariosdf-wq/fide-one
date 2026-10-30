"""Vozes do vídeo 27 anos: corta, limpa e posiciona narração + entrevistas numa linha do tempo.
Uso: python3 -I build_audio.py <projeto>
Saída: work/audio/voz-*.wav (48 kHz mono, já tratados) e work/timeline.json."""
import json, subprocess, sys
import numpy as np, soundfile as sf

P = sys.argv[1]
SR = 48000
MAXP = 0.42          # pausas internas da narração maiores que isso viram este valor


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def env(a, hop=480):                    # energia em dB a cada 10 ms
    n = len(a) // hop
    return 20 * np.log10(np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)


def refine(e, t, direction, floor):
    """Anda a partir de t até encontrar silêncio (não corta consoante suave)."""
    i = int(t * 100)
    i = min(max(i, 0), len(e) - 1)
    while 0 < i < len(e) - 1 and e[i] > floor + 8:
        i += direction
    return i / 100


def clean(a, noise_tail, name):
    """Limpeza: perfil de ruído dos segundos de silêncio do fim da gravação."""
    nf = 20 * np.log10(np.sqrt((noise_tail ** 2).mean()) + 1e-9)
    tmp_in, tmp_out = f"{P}/work/audio/_in.wav", f"{P}/work/audio/{name}.wav"
    sf.write(tmp_in, a, SR)
    chain = (f"highpass=f=80,afftdn=nr=14:nf={max(-80, min(-20, nf)):.0f}:tn=1,"
             "equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1:g=2,deesser=i=0.3,"
             "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,"
             "loudnorm=I=-18:TP=-3:LRA=9")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp_in, "-af", chain, "-ar", str(SR), tmp_out], check=True)
    return tmp_out


def cut(src, pieces, name, tighten=False):
    a = load(src)
    e = env(a)
    floor = np.percentile(e, 8)
    tail = a[-int(1.5 * SR):]                       # silêncio gravado no fim
    out, used = [], []
    for k, piece in enumerate(pieces):
        s, t = piece[:2]
        if len(piece) < 3:                           # 3º item "exato": corte manual (entre palavras coladas)
            s = refine(e, s, -1, floor) - 0.04
            t = refine(e, t, +1, floor) + 0.06
        used.append((round(max(0, s), 3), round(t, 3)))
        seg = a[int(max(0, s) * SR): int(t * SR)]
        if tighten:                                  # encurta pausas longas dentro do trecho
            ee = env(seg)
            q = ee < floor + 8
            keep = np.ones(len(seg), bool)
            i = 0
            while i < len(q):
                if q[i]:
                    j = i
                    while j < len(q) and q[j]:
                        j += 1
                    if (j - i) / 100 > MAXP and i > 0 and j < len(q):
                        cut_n = int(((j - i) / 100 - MAXP) * SR)
                        mid = int((i + j) / 2 * 480)
                        keep[mid - cut_n // 2: mid + cut_n - cut_n // 2] = False
                    i = j
                else:
                    i += 1
            seg = seg[keep]
        f = np.ones(len(seg)); r = int(0.012 * SR)
        f[:r] = np.linspace(0, 1, r); f[-r:] = np.linspace(1, 0, r)
        out.append(seg * f)
        if k < len(pieces) - 1:
            out.append(np.zeros(int(0.32 * SR)))
    a2 = np.concatenate(out)
    path = clean(a2, tail, name)
    return path, len(a2) / SR, used


R = f"{P}/raw"
voices = []
for b in range(1, 7):
    src = f"{R}/narracao/narracao-bloco-{b:02d}.ogg"
    ws = [w for w in json.load(open(src.replace(".ogg", ".json")))["words"] if w["type"] == "word"]
    path, d, used = cut(src, [(ws[0]["start"], ws[-1]["end"])], f"voz-n{b}", tighten=True)
    voices.append((f"n{b}", path, d, src, used))
E = f"{R}/entrevistas/entrevista-"
for name, src, pieces in [
    ("kelly", "kelly-pergunta-04", [(5.10, 9.26)]),
    ("kelly2", "kelly-pergunta-05", [(6.72, 8.98, "exato"), (10.22, 13.36, "exato")]),   # sem "Então" e sem o tropeço "e que deixe"
    ("geo", "geovana-pergunta-02", [(9.24, 11.46)]),
    ("geo2", "geovana-pergunta-04", [(4.31, 10.39)]),
    ("kelly-cf", "kelly-complete-a-frase", [(4.94, 5.48)]),
    ("geo-cf", "geovana-complete-a-frase", [(3.58, 6.84)]),
]:
    path, d, used = cut(f"{E}{src}.mp4", pieces, f"voz-{name}")
    voices.append((name, path, d, f"{E}{src}.mp4", used))
for v in voices:
    print(f"{v[0]:9s} {v[2]:6.2f}")
json.dump({v[0]: {"file": v[1], "dur": round(v[2], 3), "src": v[3], "pieces": v[4], "gap": 0.32} for v in voices},
          open(f"{P}/work/audio/voices.json", "w"), indent=1)
