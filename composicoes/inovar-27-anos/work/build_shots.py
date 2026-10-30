"""Prepara cada take no formato de TV (1920x1080, 30 fps, sem áudio, com a cor do vídeo).
Uso: python3 -I build_shots.py <projeto>   (lê work/timeline.json, grava work/shots/*.mp4 e work/shots.json)"""
import json, subprocess, sys
P = sys.argv[1]
T = json.load(open(f"{P}/work/timeline.json"))
OVER = 0.5      # cada take sobra 0,5 s para a transição com o próximo
GRADE = "eq=contrast=1.07:saturation=1.13:brightness=0.012:gamma=0.98"


def dur(take):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                 f"{P}/raw/takes/{take}.mp4"], capture_output=True, text=True).stdout)


out = {}
for secname, shots in T["shots"].items():
    a, b = T["sections"][secname]
    total = b - a
    each = total / len(shots)
    t = a
    lst = []
    for i, (take, tin, mode, speed) in enumerate(shots):
        d = each + (OVER if i < len(shots) - 1 or secname != "final" else 0)
        avail = (dur(take) - tin - 0.05) * 1.0
        sp = min(speed, avail / d)                  # se o take for curto, desacelera para caber
        name = f"{secname}-{i + 1:02d}"
        if mode == "h":
            vf = "scale=1920:1080:flags=lanczos"
        elif mode.startswith("v4k@"):
            y = float(mode[4:])
            vf = f"crop=2160:1215:0:'max(0,min(ih-1215,{y}*ih-607))',scale=1920:1080:flags=lanczos"
        else:   # blur: laterais com o próprio take desfocado
            vf = ("split[a][b];[a]scale=1920:-2,crop=1920:1080,boxblur=60:4,eq=brightness=-0.12:saturation=0.8[bg];"
                  "[b]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0")
        vf = f"setpts=(PTS-STARTPTS)/{sp:.4f},{vf},{GRADE},fps=30,format=yuv420p"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(tin), "-i", f"{P}/raw/takes/{take}.mp4",
                        "-t", f"{d / 1 * sp + 0.1:.3f}" if False else f"{d * sp + 0.1:.3f}", "-an",
                        "-filter_complex", vf, "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "fast", "-crf", "16",
                        f"{P}/work/shots/{name}.mp4"], check=True)
        lst.append({"name": name, "take": take, "start": round(t, 3), "dur": round(d, 3), "speed": round(sp, 3)})
        print(f"{name:16s} {take} in {tin:5.2f} {mode:9s} vel {sp:4.2f}  {t:6.2f}+{d:5.2f}")
        t += each
    out[secname] = lst
json.dump(out, open(f"{P}/work/shots.json", "w"), indent=1)
