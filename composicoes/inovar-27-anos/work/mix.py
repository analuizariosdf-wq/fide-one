"""Mixagem final: vozes nos seus lugares + música (cresce até o fim, abaixa sob as vozes) + ambiente da fachada.
Uso: python3 -I mix.py <projeto> <musica.wav|-> <saida.wav>
Final: -16 LUFS integrado, pico real até -1 dB."""
import json, subprocess, sys
import numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d

P, MUS, OUT = sys.argv[1:4]
SR = 48000
T = json.load(open(f"{P}/work/timeline.json"))
END = T["end"]
n = int(END * SR)
db = lambda x: 10 ** (x / 20)


def load(path, ss=None, t=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(ss)] if ss is not None else []) + ["-i", path]
    cmd += (["-t", str(t)] if t else []) + ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).copy()


voice = np.zeros(n)
active = np.zeros(n)
for name, v in T["voices"].items():
    a = load(v["file"])
    i = int(v["start"] * SR)
    voice[i:i + len(a)] += a[: n - i]
    active[i:i + len(a)] = 1

# ambiente da rua na abertura (som do próprio take da fachada), some quando a música cresce
amb = load(f"{P}/raw/takes/20261027_142912.mp4", 0, 7.0)
amb = amb / (np.sqrt((amb ** 2).mean()) + 1e-9) * db(-34)
amb *= np.interp(np.arange(len(amb)) / SR, [0, 0.6, 4.5, 7.0], [0, 1, 0.8, 0])
voice_bus = voice.copy()
voice_bus[: len(amb)] += amb

mix = voice_bus
if MUS != "-":
    m = load(MUS)
    if len(m) < n:
        m = np.concatenate([m, np.zeros(n - len(m))])
    m = m[:n]
    from scipy.signal import butter, sosfilt
    m = sosfilt(butter(2, 70, btype='high', fs=SR, output='sos'), m)      # tira o grave embolado da geração
    lo = sosfilt(butter(2, 180, btype='low', fs=SR, output='sos'), m)
    m = m - 0.45 * lo                                                     # grave ~5 dB mais baixo
    m = m / (np.sqrt((m ** 2).mean()) + 1e-9) * db(-20)
    t = np.arange(n) / SR
    V = T["voices"]
    S = T["sections"]
    # curva da música: entra suave, cresce em cada bloco, pico nos "27 anos", fecha com fade
    base = np.interp(t,
                     [0, 4, V["n2"]["start"], S["kelly"][0], S["kelly"][0] + 1, S["equipe"][0], S["pergunta"][0],
                      S["pergunta"][0] + 0.4, S["final"][0], END - 4, END - 0.3, END],
                     [-40, -9, -6, -5, -9, -5, -4, -2, -3, -2, -12, -60])
    # abaixa sob as vozes (mais sob as entrevistas)
    talk = np.zeros(n)
    for name, v in V.items():
        i, j = int((v["start"] - 0.15) * SR), int((v["start"] + v["dur"] + 0.1) * SR)
        depth = 13 if name in ("kelly", "kelly2", "geo", "geo2", "kelly-cf", "geo-cf") else 10
        talk[i:j] = np.maximum(talk[i:j], depth)
    talk = uniform_filter1d(talk, int(0.35 * SR))          # sobe e desce em ~0,35 s
    m = m * db(base - talk)
    mix = voice_bus + m

sf.write(f"{P}/work/audio/_premix.wav", mix.astype(np.float32), SR, subtype="FLOAT")
# loudnorm em duas passadas
r = subprocess.run(["ffmpeg", "-v", "info", "-i", f"{P}/work/audio/_premix.wav", "-af",
                    "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(r[r.rindex("{"):r.rindex("}") + 1])
af = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,"
      "alimiter=limit=0.87:attack=3:release=60:level=false,aresample=48000")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{P}/work/audio/_premix.wav", "-af", af, "-ar", "48000",
                "-c:a", "pcm_s16le", OUT], check=True)
print("ok", OUT, END)
