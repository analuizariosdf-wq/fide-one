"""Etapa 2: cor, voz tratada, música com ducking e efeitos sonoros sobre o corte aprovado.

Uso: python3 -I stage2.py <project_dir> voice|render
  voice  -> work/voice.wav (voz limpa, -14 LUFS)
  render -> edit/02-cor-audio.mp4 (precisa de work/voice.wav e assets/bgm/bed.wav)
"""
import json, subprocess, sys, re

P, MODE = sys.argv[1], sys.argv[2]
FPS = 30
SFX_DIR = ".claude/skills/media-use/audio/assets/sfx"
edl = json.load(open(f"{P}/work/edl-approved.json"))
segs, takes = edl["segments"], edl["takes"]
idx = {t: i for i, t in enumerate(takes)}
grade = json.load(open(f"{P}/work/grade.json"))
inputs = sum((["-i", f"{P}/raw/{t}.mp4"] for t in takes), [])


def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-3000:])
    return r.stderr


VOICE_CHAIN = ",".join([
    "highpass=f=80",
    "afftdn=nr=12:nf=-50:tn=1",                                   # ruído de fundo e chiado
    "agate=threshold=0.012:ratio=1.8:range=0.4:attack=8:release=180",  # reduz a cauda de eco entre palavras
    "equalizer=f=220:t=q:w=1.2:g=-2.5",                           # tira o "embolado"
    "equalizer=f=3200:t=q:w=1.0:g=2.5",                           # presença
    "highshelf=f=9000:g=1.5",                                     # brilho
    "deesser=i=0.35",
    "acompressor=threshold=-22dB:ratio=3:attack=6:release=90:makeup=2",
])

if MODE == "voice":
    parts, cat = [], []
    for i, s in enumerate(segs):
        d = s["end"] - s["start"]
        parts.append(f"[{idx[s['take']]}:a]atrim=start={s['start']}:end={s['end']},asetpts=PTS-STARTPTS,"
                     f"aresample=48000,adeclip=w=55:o=75,afade=t=in:d=0.008,afade=t=out:st={max(0, d - 0.012):.3f}:d=0.012[a{i}]")
        cat.append(f"[a{i}]")
    graph = ";".join(parts) + ";" + "".join(cat) + f"concat=n={len(segs)}:v=0:a=1,{VOICE_CHAIN}[v]"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", graph, "-map", "[v]", "-ac", "1", "-c:a", "pcm_s24le", f"{P}/work/voice-pre.wav"])
    # loudnorm em duas passadas: -14 LUFS, pico real abaixo de -1,5 dBTP
    m = run(["ffmpeg", "-i", f"{P}/work/voice-pre.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json", "-f", "null", "-"])
    j = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", m).group(0))
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    run(["ffmpeg", "-y", "-i", f"{P}/work/voice-pre.wav", "-af", f"{ln},aresample=48000", "-ac", "1", "-c:a", "pcm_s24le", f"{P}/work/voice.wav"])
    print("voice ok")

elif MODE in ("render", "mix"):
    total = sum(s["end"] - s["start"] for s in segs)
    TAIL = float(sys.argv[3]) if MODE == "mix" else 0.0   # encerramento depois da última fala
    cues = json.load(open(f"{P}/work/sfx-cues.json"))
    sfx_file = {"whoosh": "whoosh-short.mp3", "tum": "impact-bass-1.mp3", "pop": "pop.mp3", "ding": "chime.mp3"}
    sfx_gain = {"whoosh": -12, "tum": -10, "pop": -14, "ding": -13}       # dB, discretos sob a voz
    sfx_lead = {"whoosh": 0.0, "tum": 0.02, "pop": 0.0, "ding": 0.0}      # adianta o arquivo para o golpe cair no tempo
    n_in = len(takes)
    extra = ["-i", f"{P}/work/voice.wav", "-i", f"{P}/assets/bgm/bed.wav"]
    for c in cues:
        extra += ["-i", f"{SFX_DIR}/{sfx_file[c['sfx']]}"]
    vi, mi = (0, 1) if MODE == "mix" else (n_in, n_in + 1)
    g = []
    # vídeo: cortes aprovados + correção por trecho + acabamento global
    for i, s in enumerate(segs):
        p = grade["per_segment"][i]
        v = (f"[{idx[s['take']]}:v]trim=start={s['start']}:end={s['end']},setpts=PTS-STARTPTS,fps={FPS},"
             f"scale=1080:1920:flags=lanczos")
        if s["zoom"] != 1.0:
            zw, zh = round(1080 * s["zoom"] / 2) * 2, round(1920 * s["zoom"] / 2) * 2
            v += f",scale={zw}:{zh}:flags=lanczos,crop=1080:1920:{(zw - 1080) // 2}:{round((zh - 1920) * 0.30)}"
        v += f",colorchannelmixer=rr={p['r']}:gg={p['g']}:bb={p['b']},setsar=1[v{i}]"
        g.append(v)
    g.append("".join(f"[v{i}]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0,{grade['global']}[vout]")
    # música: entra suave, fica ~8 dB abaixo da voz, abaixa sozinha com a fala, sobe no encerramento
    g.append(f"[{vi}:a]aformat=channel_layouts=stereo,apad=whole_dur={total + TAIL:.3f},asplit=2[vox][key]")
    end = total + TAIL
    rise = total - 5.5 if not TAIL else total - 0.3
    g.append(f"[{mi}:a]aformat=channel_layouts=stereo,atrim=0:{end:.3f},asetpts=PTS-STARTPTS,"
             f"volume=0dB,afade=t=in:d=1.5,"
             f"volume='if(gt(t,{rise:.2f}),1+{0.6 if not TAIL else 0.6}*min(1,(t-{rise:.2f})/{1.5 if not TAIL else 0.8}),1)':eval=frame,"
             f"afade=t=out:st={end - 1.2:.2f}:d=1.2[bgm]")
    g.append("[bgm][key]sidechaincompress=threshold=0.08:ratio=3:attack=40:release=450:makeup=1[duck]")
    mix = ["[vox]", "[duck]"]
    for k, c in enumerate(cues):
        n = mi + 1 + k
        ms = max(0, int(round((c["t"] - sfx_lead[c["sfx"]]) * 1000)))
        g.append(f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={sfx_gain[c['sfx']]}dB,adelay={ms}|{ms}[s{k}]")
        mix.append(f"[s{k}]")
    g.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=first,alimiter=limit=0.84:level=false[aout]")
    if MODE == "mix":
        g = [x for x in g if "[vout]" not in x and not x.startswith("[v")] + [x for x in g if x.startswith("[vox]")]
        g = [x for x in g if not (x.startswith("[") and "colorchannelmixer" in x)]
        open(f"{P}/work/filter-mix.txt", "w").write(";\n".join(g))
        run(["ffmpeg", "-y", "-i", f"{P}/work/voice.wav", "-i", f"{P}/assets/bgm/bed.wav", *extra[4:],
             "-/filter_complex", f"{P}/work/filter-mix.txt", "-map", "[aout]", "-c:a", "pcm_s16le", "-ar", "48000", sys.argv[4]])
        print("mix ok"); sys.exit()
    open(f"{P}/work/filter-stage2.txt", "w").write(";\n".join(g))
    run(["ffmpeg", "-y", *inputs, *extra, "-/filter_complex", f"{P}/work/filter-stage2.txt", "-map", "[vout]", "-map", "[aout]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS),
         "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", f"{P}/edit/02-cor-audio.mp4"])
    print("render ok")
