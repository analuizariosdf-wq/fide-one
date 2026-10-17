"""Etapa 1 (Reel 03, vaga ASG): corte agressivo guiado pelo áudio.

Cada take vira trechos de fala separados pelos silêncios medidos no som (não pela transcrição).
Cada trecho ganha 2 frames de folga antes e depois; o enquadramento alterna 100% / 110% a cada corte.
Uso: python3 -I build_cut.py <project_dir> [--approved]
"""
import json, os, subprocess, sys
import numpy as np

P = sys.argv[1]
APPROVED = "--approved" in sys.argv
FPS = 30
PAD = 2 / FPS          # 2 frames de folga
MIN_SIL = 0.15         # silêncio mínimo que vira corte (menor que isso só daria um tranco sem ganhar tempo)
ZOOM = 1.10
EYE_Y = 0.30
ORDER = [("Cena 1", "take01"), ("Cena 2", "take02"), ("Cena 3", "take03"), ("Cena 4", "take04")]
# cortes de erros aprovados: (take, de, até) em segundos do take
MISTAKES = []
# respirações audíveis no meio da frase (acima do limiar de silêncio), cortadas sempre
BREATHS = [("take02", 15.63, 15.86)]   # respiração antes de "e disponibilidade"


def envelope(take):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{P}/raw/{take}.mp4", "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.int16).astype(float) / 32768
    n = len(a) // 160
    return 20 * np.log10(np.sqrt((a[: n * 160].reshape(n, 160) ** 2).mean(1)) + 1e-9)


segments = []
for scene, take in ORDER:
    e = envelope(take)
    floor = np.percentile(e, 10)
    quiet = e < max(floor + 12, -40)
    loud = e > -24                         # fala de verdade (respiração e ruído ficam abaixo disso)
    first = int(np.argmax(loud))
    last = len(e) - int(np.argmax(loud[::-1])) - 1
    while first > 0 and not quiet[first - 1]:          # recua até o silêncio: não engole consoante suave ("P" de "Para")
        first -= 1
    while last < len(e) - 1 and not quiet[last + 1]:   # avança até o fim real do som
        last += 1
    # trechos de fala = entre silêncios de pelo menos MIN_SIL dentro de [first, last]
    parts, i, start = [], first, first
    while i <= last:
        if quiet[i]:
            j = i
            while j <= last and quiet[j]:
                j += 1
            if (j - i) / 100 >= MIN_SIL:
                parts.append((start, i))
                start = j
            i = j
        else:
            i += 1
    parts.append((start, last + 1))
    parts = [(a, b) for a, b in parts if (b - a) >= 25 and loud[a:b].any()]   # descarta respiração solta no meio da pausa
    for k, (a, b) in enumerate(parts):
        s, t = a / 100 - PAD, b / 100 + PAD
        for mt, ma, mb in BREATHS + (MISTAKES if APPROVED else []):
            if True:
                if mt == take and s < ma < t:      # erro no meio do trecho: divide e pula o erro
                    segments.append({"scene": scene, "take": take, "start": round(s, 3), "end": round(ma, 3)})
                    s = mb
        segments.append({"scene": scene, "take": take, "start": round(max(0, s), 3), "end": round(t, 3)})

for i, s in enumerate(segments):
    s["zoom"] = ZOOM if i % 2 else 1.0     # alterna em todos os cortes (inclusive entre takes: o enquadramento é o mesmo)

takes = sorted({s["take"] for s in segments})
idx = {t: i for i, t in enumerate(takes)}
lines, cat = [], []
for i, s in enumerate(segments):
    d = s["end"] - s["start"]
    v = (f"[{idx[s['take']]}:v]trim=start={s['start']}:end={s['end']},setpts=PTS-STARTPTS,fps={FPS},"
         f"scale=1080:1920:flags=lanczos")
    if s["zoom"] != 1.0:
        zw, zh = round(1080 * s["zoom"] / 2) * 2, round(1920 * s["zoom"] / 2) * 2
        v += f",scale={zw}:{zh}:flags=lanczos,crop=1080:1920:{(zw - 1080) // 2}:{round((zh - 1920) * EYE_Y)}"
    lines.append(v + f",setsar=1[v{i}]")
    lines.append(f"[{idx[s['take']]}:a]atrim=start={s['start']}:end={s['end']},asetpts=PTS-STARTPTS,aresample=48000,"
                 f"afade=t=in:d=0.006,afade=t=out:st={max(0, d - 0.008):.3f}:d=0.008[a{i}]")
    cat.append(f"[v{i}][a{i}]")
lines.append("".join(cat) + f"concat=n={len(segments)}:v=1:a=1[vout][aout]")
tag = "approved" if APPROVED else "preview"
open(f"{P}/work/filter-{tag}.txt", "w").write(";\n".join(lines))
total = sum(s["end"] - s["start"] for s in segments)
json.dump({"segments": segments, "duration": round(total, 2), "takes": takes},
          open(f"{P}/work/edl-{tag}.json", "w"), indent=1, ensure_ascii=False)
inputs = " ".join(f"-i {P}/raw/{t}.mp4" for t in takes)
print(f"ffmpeg -y {inputs} -/filter_complex {P}/work/filter-{tag}.txt -map [vout] -map [aout] "
      f"-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r {FPS} -c:a aac -b:a 192k -movflags +faststart "
      f"{P}/edit/01-corte-bruto-{tag}.mp4")
print(f"# {len(segments)} trechos, {total:.2f} s", file=sys.stderr)
for s in segments:
    print(f"#  {s['scene']} {s['take']} {s['start']:6.2f}-{s['end']:6.2f} zoom {s['zoom']:.2f}", file=sys.stderr)
