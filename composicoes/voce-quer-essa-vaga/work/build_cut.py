"""Etapa 1: monta o corte bruto do Reel a partir dos takes transcritos.

Uso: python3 -I build_cut.py <project_dir> [--approved]
  --approved aplica os cortes de erros aprovados (lista MISTAKES).
Escreve work/edl.json e um script de filtro ffmpeg; imprime o comando de render.
"""
import json, sys, os

P = sys.argv[1]
APPROVED = "--approved" in sys.argv
FPS = 30
PRE = 3 / FPS        # folga antes da primeira palavra (3 frames)
POST = 4 / FPS       # folga depois da última palavra (4 frames)
MIN_GAP = 0.40       # pausas menores que isso ficam como estão (respiração natural)
ZOOM = 1.08
ZOOM_MIN_REMOVED = 0.15  # só alterna o zoom quando o corte tira pelo menos isso
EYE_Y = 0.30         # ponto de ancoragem do zoom (altura dos olhos)

# Trechos do roteiro: (cena, take, primeira palavra, última palavra) em segundos do take.
SCENES = [
    ("Gancho", "take01", 0.65, 3.89),
    ("Cena 1", "take01", 25.60, 29.96),
    ("Cena 2", "take02", 1.14, 12.88),
    ("Cena 3", "take03", 1.76, 17.04),
    ("Cena 4", "take04", 12.50, 26.48),
]
# Cortes de erros propostos (só entram com --approved): (take, de, até)
MISTAKES = [
    ("take02", 10.96, 12.20),  # "do que esse aqui," -> fica "melhor do que aqui." (corte na pausa medida no áudio)
]


def words(take):
    d = json.load(open(f"{P}/raw/{take}.json"))
    return [w for w in d["words"] if w.get("type", "word") == "word"]


segments = []
for scene, take, a, b in SCENES:
    ws = [w for w in words(take) if w["start"] >= a - 0.01 and w["end"] <= b + 0.01]
    if APPROVED:
        for t, ma, mb in MISTAKES:
            if t == take:
                ws = [w for w in ws if not (w["start"] >= ma - 0.05 and w["end"] <= mb + 0.05)]
    # agrupa em frases: quebra onde a pausa é longa ou onde há corte de erro
    groups, cur = [], [ws[0]]
    for prev, w in zip(ws, ws[1:]):
        gap = w["start"] - prev["end"]
        forced = APPROVED and any(t == take and prev["end"] <= ma + 0.05 and w["start"] >= mb - 0.05 for t, ma, mb in MISTAKES)
        if gap > MIN_GAP or forced:
            groups.append(cur); cur = [w]
        else:
            cur.append(w)
    groups.append(cur)
    for i, g in enumerate(groups):
        s = g[0]["start"] - PRE
        e = g[-1]["end"] + POST
        if APPROVED:
            for t, ma, mb in MISTAKES:
                if t == take and abs(g[-1]["end"] - ma) < 0.1:
                    e = ma  # termina exatamente no ponto do corte
                if t == take and abs(g[0]["start"] - mb) < 0.1:
                    s = mb
        segments.append({"scene": scene, "take": take, "start": round(max(0, s), 3), "end": round(e, 3),
                         "text": " ".join(w["text"] for w in g), "first_in_scene": i == 0})

# divide trechos onde o áudio mostra uma pausa longa que a transcrição escondeu
import subprocess, re
def silences(take):
    out = subprocess.run(["ffmpeg", "-nostats", "-i", f"{P}/raw/{take}.mp4", "-af", "silencedetect=noise=-35dB:d=0.3",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    return list(zip(st, en))
SIL = {t: silences(t) for t in {s["take"] for s in segments}}
split = []
for s in segments:
    parts = [s]
    for a, b in SIL[s["take"]]:
        cur = parts[-1]
        if b - a > MIN_GAP and cur["start"] + 0.3 < a and b < cur["end"] - 0.3:
            first = dict(cur, end=round(a + POST, 3))
            second = dict(cur, start=round(b - PRE, 3), first_in_scene=False, text="(cont.) " + cur["text"])
            parts[-1:] = [first, second]
    split += parts
segments = split

# evita sobreposição dentro do mesmo take (folgas que se cruzam viram corte no meio da pausa)
for a, b in zip(segments, segments[1:]):
    if a["take"] == b["take"] and a["end"] > b["start"]:
        mid = round((a["end"] + b["start"]) / 2, 3)
        a["end"], b["start"] = mid, mid

# ajusta cada ponto de corte pelo áudio: começo e fim precisam cair num instante quieto,
# com 2 a 4 frames de folga antes do início / depois do fim da fala
import numpy as np
SR, HOP = 16000, 160  # janelas de 10 ms
ENV = {}
def envelope(take):
    if take not in ENV:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{P}/raw/{take}.mp4", "-ac", "1", "-ar", str(SR),
                              "-f", "s16le", "-"], capture_output=True).stdout
        a = np.frombuffer(raw, np.int16).astype(float) / 32768
        n = len(a) // HOP
        e = 20 * np.log10(np.sqrt((a[: n * HOP].reshape(n, HOP) ** 2).mean(1)) + 1e-9)
        floor = np.percentile(e, 10)
        ENV[take] = (e, max(floor + 10, -42))
    return ENV[take]

def quiet_before(take, t, limit):
    """Último instante quieto antes de t (sem passar de limit). Devolve o início da fala ali."""
    e, th = envelope(take)
    i = int(t * SR / HOP)
    lo = max(int(limit * SR / HOP), 0)
    while i > lo and e[i] > th:
        i -= 1
    return i * HOP / SR

def quiet_after(take, t, limit):
    e, th = envelope(take)
    i = int(t * SR / HOP)
    hi = min(int(limit * SR / HOP), len(e) - 1)
    while i < hi and e[i] > th:
        i += 1
    return i * HOP / SR

for i, s in enumerate(segments):
    prev_end = segments[i - 1]["end"] if i and segments[i - 1]["take"] == s["take"] else 0
    nxt_start = segments[i + 1]["start"] if i + 1 < len(segments) and segments[i + 1]["take"] == s["take"] else 1e9
    onset = quiet_before(s["take"], s["start"] + PRE, max(prev_end, s["start"] - 0.4))
    s["start"] = round(max(prev_end, onset - 2 / FPS), 3)
    offset = quiet_after(s["take"], s["end"] - POST, min(nxt_start, s["end"] + 0.4))
    s["end"] = round(min(nxt_start, max(s["end"], offset + 2 / FPS)), 3)

# cortes de erros aprovados têm pontos medidos à mão: o ajuste automático não mexe neles
if APPROVED:
    for s in segments:
        for t, ma, mb in MISTAKES:
            if s["take"] == t and abs(s["end"] - ma) < 0.15:
                s["end"] = ma
            if s["take"] == t and abs(s["start"] - mb) < 0.15:
                s["start"] = mb

# cortes que tirariam menos de 0,15 s só criam um "tranco" na imagem: junta os trechos
merged = [segments[0]]
for s in segments[1:]:
    m = merged[-1]
    if s["take"] == m["take"] and s["start"] - m["end"] < 0.15:
        m["end"] = s["end"]
        m["text"] += " " + s["text"]
    else:
        merged.append(s)
segments = merged

# zoom alternado só nos cortes dentro do mesmo take que tiram um pedaço perceptível
zoom = 1.0
for i, s in enumerate(segments):
    if s["first_in_scene"]:
        zoom = 1.0
    else:
        removed = s["start"] - segments[i - 1]["end"]
        if removed >= ZOOM_MIN_REMOVED:
            zoom = ZOOM if zoom == 1.0 else 1.0
    s["zoom"] = zoom

takes = sorted({s["take"] for s in segments})
idx = {t: i for i, t in enumerate(takes)}
lines, cat = [], []
for i, s in enumerate(segments):
    n = idx[s["take"]]
    d = s["end"] - s["start"]
    v = f"[{n}:v]trim=start={s['start']}:end={s['end']},setpts=PTS-STARTPTS,fps={FPS},scale=1080:1920:flags=lanczos"
    if s["zoom"] != 1.0:
        zw, zh = round(1080 * s["zoom"] / 2) * 2, round(1920 * s["zoom"] / 2) * 2
        y = round((zh - 1920) * EYE_Y)
        v += f",scale={zw}:{zh}:flags=lanczos,crop=1080:1920:{(zw - 1080) // 2}:{y}"
    v += f",setsar=1[v{i}]"
    fo = max(0, d - 0.012)
    a = f"[{n}:a]atrim=start={s['start']}:end={s['end']},asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:d=0.008,afade=t=out:st={fo:.3f}:d=0.012[a{i}]"
    lines += [v, a]
    cat.append(f"[v{i}][a{i}]")
lines.append("".join(cat) + f"concat=n={len(segments)}:v=1:a=1[vout][aout]")

tag = "approved" if APPROVED else "preview"
os.makedirs(f"{P}/work", exist_ok=True)
open(f"{P}/work/filter-{tag}.txt", "w").write(";\n".join(lines))
total = sum(s["end"] - s["start"] for s in segments)
json.dump({"segments": segments, "duration": round(total, 2), "takes": takes}, open(f"{P}/work/edl-{tag}.json", "w"), indent=1, ensure_ascii=False)
inputs = " ".join(f"-i {P}/raw/{t}.mp4" for t in takes)
print(f"ffmpeg -y {inputs} -/filter_complex {P}/work/filter-{tag}.txt -map [vout] -map [aout] "
      f"-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r {FPS} -c:a aac -b:a 192k -movflags +faststart "
      f"{P}/edit/01-corte-bruto-{tag}.mp4")
print(f"# {len(segments)} trechos, {total:.2f} s", file=sys.stderr)
for s in segments:
    print(f"#  {s['scene']:7} {s['take']} {s['start']:6.2f}-{s['end']:6.2f} zoom {s['zoom']:.2f} | {s['text']}", file=sys.stderr)
