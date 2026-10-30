"""Vídeo das entrevistas sincronizado com as vozes cortadas (mesmos trechos do som).
A cada corte o enquadramento alterna 100% / 112% (centrado no rosto) para disfarçar o salto.
Uso: python3 -I build_interviews.py <projeto>  → work/shots/{kelly,geovanna,respostas}.mp4"""
import json, subprocess, sys
P = sys.argv[1]
T = json.load(open(f"{P}/work/timeline.json"))
V = json.load(open(f"{P}/work/audio/voices.json"))
GRADE = "eq=contrast=1.07:saturation=1.10:brightness=0.012:gamma=0.98"
FACE = {"kelly": (1000, 400), "geovana": (960, 440)}
SECS = {"kelly": ["kelly", "kelly2"], "geovanna": ["geo", "geo2"], "respostas": ["kelly-cf", "geo-cf"]}

for sec, names in SECS.items():
    a, b = T["sections"][sec]
    segs = []                          # [src, src_in, src_out]
    cursor = a
    for name in names:
        v, tl = V[name], T["voices"][name]["start"]
        for i, (s, t) in enumerate(v["pieces"]):
            head = tl - cursor
            if segs and segs[-1][0] == v["src"] and i > 0:        # salto dentro da mesma resposta: divide a folga
                segs[-1][2] += head / 2
                s -= head / 2
            else:
                s -= head
            segs.append([v["src"], s, t])
            cursor = tl + (t - v["pieces"][i][0])
            tl = cursor + v["gap"]
    segs[-1][2] += b - cursor
    parts, inputs = [], []
    for k, (src, s, t) in enumerate(segs):
        who = "kelly" if "kelly" in src else "geovana"
        fx, fy = FACE[who]
        z = 1.0 if k % 2 == 0 else 1.12
        vf = f"[{k}:v]setpts=PTS-STARTPTS,scale=1920:1080"
        if z != 1.0:
            w, h = round(1920 * z / 2) * 2, round(1080 * z / 2) * 2
            x = min(max(0, round(fx * z - 960)), w - 1920); y = min(max(0, round(fy * z - 540 + 60)), h - 1080)
            vf += f",scale={w}:{h}:flags=lanczos,crop=1920:1080:{x}:{y}"
        parts.append(vf + f",{GRADE},fps=30,format=yuv420p[v{k}]")
        inputs += ["-ss", f"{max(0, s):.3f}", "-t", f"{t - max(0, s):.3f}", "-i", src]
        print(f"{sec:10s} {src.split('/')[-1]:40s} {s:6.2f}-{t:6.2f} zoom {z}")
    fc = ";".join(parts) + ";" + "".join(f"[v{k}]" for k in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[out]", "-t", f"{b - a:.3f}",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "16", f"{P}/work/shots/{sec}.mp4"], check=True)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                        f"{P}/work/shots/{sec}.mp4"], capture_output=True, text=True).stdout.strip()
    print(f"  {sec}: janela {b - a:.2f} s, vídeo {d} s")
