"""Gera index.html (Reel 02 "O custo de uma vaga vazia") e cover/index.html (capa).

Tempos vêm da fala no corte aprovado (../work/transcript-cut.json, conferidos à mão)
e dos efeitos da etapa 2 (../work/sfx-cues.json). Rode: python3 -I build_reel.py
"""
import json, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
SPEECH_END = 43.09     # fim do vídeo da pessoa
CTA_IN = 42.88         # fim de "auxiliar": a cartela cresce a partir da calculadora
OUTRO_IN = 45.0        # encerramento da cliente, inteiro
TOTAL = 50.0           # = mix.wav

cues = {c["sfx"] + (str(i) if c["sfx"] == "plim" else ""): c["t"]
        for i, c in enumerate(json.load(open(os.path.join(HERE, "../work/sfx-cues.json")))["cues"])}
PLIMS = sorted(t for k, t in cues.items() if k.startswith("plim"))
T = dict(counter_lock=2.00, chaching=cues["cha-ching"], whoosh=cues["whoosh"], impact=cues["impacto"],
         dive=cues["mergulho"], calc=cues["calculadora"], spark=cues["brilho"])

# ---------- legendas: grupos de 2 a 4 palavras; ** = palavra-chave (caixa amarela) ----------
CAPTIONS = [
    [("Uma", 0.08), ("vaga", 0.34), ("vazia", 0.70)],
    [("pode", 1.04), ("estar", 1.22), ("custando", 1.48)],
    [("muito", 2.00), ("mais", 2.42), ("do", 2.64), ("que", 2.76)],
    [("o", 2.86), ("**salário", 3.02)],
    [("de", 3.30), ("quem", 3.42), ("deveria", 3.54)],
    [("estar", 3.94), ("nela.", 4.12)],
    [("Quando", 4.57), ("uma", 4.93), ("posição", 5.11)],
    [("fica", 5.51), ("aberta", 5.79), ("por", 6.09)],
    [("muito", 6.35), ("tempo,", 6.69)],
    [("a", 7.12), ("empresa", 7.19), ("normalmente", 7.45)],
    [("olha", 8.11), ("só", 8.33), ("para", 8.53)],
    [("uma", 8.71), ("coisa:", 8.87)],
    [("Estamos", 9.33), ("economizando", 9.65)],
    [("esse", 10.21), ("**salário.", 10.40)],
    [("Mas", 11.17), ("enquanto", 11.31), ("isso…", 11.61)],
    [("alguém", 12.30), ("da", 12.59), ("equipe", 12.75)],
    [("está", 13.05), ("**acumulando", 13.23), ("**função.", 13.65)],
    [("O", 14.29), ("gestor", 14.47), ("está", 14.75)],
    [("gastando", 14.93), ("tempo", 15.27), ("operacional.", 15.67)],
    [("Prazos", 16.60), ("começam", 16.97), ("a", 17.39), ("**estourar.", 17.49)],
    [("O", 18.08), ("atendimento", 18.16), ("pode", 18.51), ("piorar.", 18.73)],
    [("E", 19.10), ("quem", 19.55), ("continua", 19.85)],
    [("segurando", 20.13), ("tudo", 20.63)],
    [("começa", 20.91), ("a", 21.27), ("se", 21.75), ("**desgastar.", 21.93)],
    [("Ou", 22.70), ("seja:", 23.01)],
    [("o", 23.57), ("custo", 23.67), ("de", 23.99), ("uma", 24.09)],
    [("vaga", 24.23), ("aberta", 24.47)],
    [("não", 24.79), ("aparece", 25.03), ("apenas", 25.37)],
    [("no", 25.81), ("**financeiro.", 26.01)],
    [("Ele", 26.91), ("aparece", 27.17), ("na", 27.61)],
    [("produtividade,", 27.89)],
    [("no", 28.97), ("clima", 29.15)],
    [("e", 29.35), ("na", 29.57), ("**retenção", 29.71)],
    [("de", 30.31), ("quem", 30.51), ("já", 30.63)],
    [("está", 30.83), ("dentro.", 31.01)],
    [("Se", 31.59), ("sua", 31.74), ("empresa", 31.96)],
    [("está", 32.32), ("adiando", 32.64)],
    [("uma", 33.04), ("contratação", 33.32), ("importante,", 33.78)],
    [("talvez", 34.78), ("valha", 35.00), ("a", 35.22), ("pena", 35.34)],
    [("calcular", 35.58), ("o", 36.06)],
    [("**custo", 36.22), ("**de", 36.56), ("**não", 36.74), ("**contratar.", 36.96)],
    [("E", 37.70), ("se", 37.86), ("precisar", 38.06)],
    [("acelerar", 38.40), ("esse", 38.82), ("processo", 38.98)],
    [("com", 39.36), ("mais", 39.58), ("estratégia,", 39.84)],
    [("a", 40.56), ("**Inovar", 40.70), ("está", 41.18)],
    [("pronta", 41.44), ("para", 41.74), ("te", 41.92), ("auxiliar.", 42.08)],
]


def esc(s):
    return html.escape(s, quote=False)


def caption_html():
    out, data = [], []
    for gi, grp in enumerate(CAPTIONS):
        start = grp[0][1] - 0.04
        nxt = CAPTIONS[gi + 1][0][1] - 0.04 if gi + 1 < len(CAPTIONS) else CTA_IN
        end = min(nxt, grp[-1][1] + 0.95) if nxt - grp[-1][1] > 1.3 else nxt
        spans, k = [], 0
        while k < len(grp):
            if grp[k][0].startswith("**"):
                run = []
                while k < len(grp) and grp[k][0].startswith("**"):
                    run.append(k); k += 1
                spans.append('<span class="kwbox">' + " ".join(
                    f'<span class="w kw" id="c{gi}w{j}">{esc(grp[j][0][2:])}</span>' for j in run) + "</span>")
            else:
                spans.append(f'<span class="w" id="c{gi}w{k}">{esc(grp[k][0])}</span>')
                k += 1
        out.append(f'<div id="cap{gi}" class="clip cap" data-start="{start:.3f}" data-duration="{end - start:.3f}" '
                   f'data-track-index="20"><div class="capline" id="capl{gi}"><span class="mover" id="mv{gi}"></span>'
                   f'{" ".join(spans)}</div></div>')
        data.append({"g": gi, "start": round(start, 3), "words": [round(t, 3) for _, t in grp],
                     "kw": [w.startswith("**") for w, _ in grp]})
    return "\n".join(out), json.dumps(data)


def svg(body, vb="0 0 24 24", sw=2.2, stroke="#fff"):
    return (f'<svg viewBox="{vb}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{body}</svg>')


ICON = {
    "folders": svg('<path d="M3 8.5V18a1.5 1.5 0 0 0 1.5 1.5h13"/><path d="M6 5.5h4l1.5 2H19a1.5 1.5 0 0 1 1.5 1.5v6.5A1.5 1.5 0 0 1 19 17H7.5A1.5 1.5 0 0 1 6 15.5V5.5Z"/>'),
    "clock": svg('<circle cx="12" cy="12" r="8.5"/><g id="hand-m"><path d="M12 12V6.5"/></g><g id="hand-h"><path d="M12 12h3.6"/></g>'),
    "calendar": svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="m9.5 13 5 4.5M14.5 13l-5 4.5"/>'),
    "star": svg('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z"/>', sw=2),
    "battery": ('<svg viewBox="0 0 30 16" fill="none"><rect x="1" y="1" width="25" height="14" rx="3" stroke="#FFCE23" stroke-width="2"/>'
                '<rect x="27" y="5" width="2.5" height="6" rx="1" fill="#FFCE23"/>'
                '<rect id="batfill" x="3.2" y="3.2" width="20.6" height="9.6" rx="1.5" fill="#fff"/></svg>'),
    "arrow": svg('<path d="M12 19V5"/><path d="m5.5 11.5 6.5-6.5 6.5 6.5"/>', sw=2.6),
}

NOTIFS = [("Equipe acumulando função", "folders"), ("Gestor no operacional", "clock"),
          ("Prazos estourando", "calendar"), ("Atendimento piorando", "star"),
          ("Equipe se desgastando", "battery")]

FONTS = "".join(
    f"@font-face{{font-family:'Montserrat';font-weight:{w};font-style:normal;src:url('assets/fonts/montserrat-latin-{w}-normal.woff2') format('woff2')}}"
    for w in (400, 700, 800, 900))

BASE_CSS = """
:root{--ink:#212829;--teal-deep:#00494F;--teal:#00696E;--mist:#D7E3E2;--paper:#F1F1F1;--yellow:#FFCE23}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:'Montserrat',sans-serif}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#000}
.ybox{display:inline-block;background:var(--yellow);color:var(--teal-deep);padding:0 .18em;border-radius:.14em}
"""

MAIN_CSS = """
#ice{position:absolute;inset:0;overflow:hidden;z-index:1}
#cam{position:absolute;inset:0;transform-origin:0 0;z-index:2}
#shake{position:absolute;inset:0}
#speaker{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#winframe{position:absolute;left:600px;top:270px;width:384px;height:536px;border:6px solid #fff;border-radius:48px;box-shadow:0 18px 50px rgba(0,0,0,.45);z-index:3}
#dim{position:absolute;inset:0;background:#000;z-index:4}
/* gancho */
#hook{position:absolute;left:0;right:0;top:252px;display:flex;flex-direction:column;align-items:center;gap:14px;z-index:6}
#hooktag{color:#fff;font-weight:700;font-size:28px;letter-spacing:.32em;text-shadow:0 2px 10px rgba(0,0,0,.6)}
#counter{display:flex;align-items:center;gap:14px;background:var(--teal-deep);border-radius:26px;padding:10px 30px;box-shadow:0 14px 40px rgba(0,0,0,.4);border:3px solid var(--teal)}
#counter .rs{color:#fff;font-weight:800;font-size:58px}
#reels{display:flex;align-items:center;height:76px;overflow:hidden}
.reel{width:44px;height:76px;overflow:hidden;position:relative}
.strip{position:absolute;left:0;top:0;display:flex;flex-direction:column}
.strip span{height:76px;line-height:76px;text-align:center;color:#fff;font-weight:800;font-size:64px}
.dot{color:#fff;font-weight:800;font-size:64px;line-height:76px;width:16px;text-align:center}
#qqq{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
#qqq .ybox{font-weight:900;font-size:62px;line-height:1.05;letter-spacing:.06em}
#numbox{position:relative}
/* recibo */
#receipt{position:absolute;z-index:6;left:90px;top:300px;width:330px;background:#fff;border-radius:10px 10px 0 0;padding:26px 24px 34px;box-shadow:0 18px 44px rgba(0,0,0,.4);color:var(--ink);transform-origin:50% 0}
#receipt:after{content:"";position:absolute;left:0;right:0;bottom:-14px;height:14px;background:linear-gradient(135deg,#fff 50%,transparent 50%) 0 0/20px 14px repeat-x,linear-gradient(-135deg,#fff 50%,transparent 50%) 0 0/20px 14px repeat-x}
#receipt .rh{font-weight:900;font-size:30px;letter-spacing:.12em;text-align:center;color:var(--teal-deep)}
#receipt .rs2{font-weight:400;font-size:20px;text-align:center;color:#55605f;margin-top:4px}
#receipt .rl{border-top:3px dashed #c7d2d1;margin:16px 0}
#receipt .row{display:flex;justify-content:space-between;font-weight:700;font-size:22px;margin:8px 0;color:#3a4544}
#receipt .tot{display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:26px;color:var(--teal-deep)}
#receipt .ok{display:inline-flex;width:34px;height:34px;border-radius:50%;background:var(--teal);align-items:center;justify-content:center}
#receipt .ok svg{width:22px;height:22px}
#stamp{position:absolute;left:34px;top:128px;border:5px solid var(--teal);color:var(--teal);font-weight:900;font-size:27px;letter-spacing:.06em;padding:5px 12px;border-radius:12px;transform:rotate(-14deg);background:rgba(255,255,255,.75)}
/* notificações */
#notifs{position:absolute;left:110px;right:110px;top:850px;height:260px;z-index:6}
.nt{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:22px;background:#fff;border-radius:30px;padding:20px 26px;box-shadow:0 16px 40px rgba(0,0,0,.35);transform-origin:50% 0}
.nt .ic{width:88px;height:88px;flex:0 0 88px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center}
.nt .ic svg{width:52px;height:52px}
.nt .tx{display:flex;flex-direction:column;gap:4px}
.nt .ap{font-weight:700;font-size:22px;color:#7b8786;letter-spacing:.02em}
.nt .tt{font-weight:800;font-size:42px;color:var(--teal-deep);letter-spacing:-.3px}
.stars{display:flex;gap:6px;margin-top:2px}
.stars svg{width:30px;height:30px}
.st-fill{fill:var(--yellow);stroke:var(--yellow)}
.nt .ic.bat svg{width:60px;height:40px}
/* iceberg */
#world{position:absolute;left:0;top:0;width:1080px;height:3400px}
#world svg{position:absolute;inset:0;width:1080px;height:3400px}
.lab{position:absolute;left:110px;font-weight:900;letter-spacing:.14em;font-size:44px;color:#fff;padding:10px 22px;border-radius:14px;background:rgba(0,73,79,.85);border:3px solid var(--teal)}
#lab-fin{top:560px;left:120px;background:rgba(0,73,79,.9)}
#lab-pro{top:2360px}
#lab-cli{top:2500px}
#lab-ret{top:2640px;background:var(--yellow);color:var(--teal-deep);border-color:var(--yellow)}
/* calculadora */
#calc{position:absolute;left:270px;top:840px;width:540px;height:420px;perspective:1400px;z-index:6}
#calcin{position:absolute;inset:0;transform-style:preserve-3d}
.face{position:absolute;inset:0;border-radius:36px;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 18px 46px rgba(0,0,0,.45)}
#front{background:var(--teal-deep);border:4px solid var(--teal);padding:26px}
#display{height:156px;background:var(--mist);border-radius:20px;padding:16px 22px;color:var(--teal-deep);font-weight:800;font-size:34px;line-height:1.2;letter-spacing:.02em}
#cursor{display:inline-block;width:4px;height:36px;background:var(--teal-deep);vertical-align:-6px;margin-left:4px}
#keys{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:20px}
.key{height:52px;border-radius:14px;background:var(--teal);color:#fff;font-weight:800;font-size:28px;display:flex;align-items:center;justify-content:center}
#back{background:var(--teal-deep);border:4px solid var(--teal);transform:rotateY(180deg);display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:800;font-size:58px;line-height:1.15;padding:30px}
/* legendas */
.cap{position:absolute;left:120px;right:120px;top:1300px;height:220px;display:flex;align-items:center;justify-content:center;z-index:10}
.capline{position:relative;text-align:center;color:#fff;font-weight:700;font-size:62px;line-height:1.3;letter-spacing:-.3px;text-shadow:0 3px 14px rgba(0,0,0,.6),0 2px 4px rgba(0,0,0,.65)}
.mover{position:absolute;left:0;top:0;width:0;height:0;background:var(--teal);border-radius:12px;z-index:0;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.w{position:relative;z-index:1;display:inline-block;padding:0 .08em}
.kwbox{position:relative;z-index:2;display:inline-block;background:var(--yellow);border-radius:.16em;padding:0 .12em;text-shadow:none}
.kwbox .w{color:var(--teal-deep)}
/* CTA */
#cta{position:absolute;inset:0;background:var(--teal-deep);z-index:20;overflow:hidden}
#cta svg.curves{position:absolute;inset:0;width:100%;height:100%}
#ctac{position:absolute;left:110px;right:110px;top:600px;display:flex;flex-direction:column;align-items:center;gap:44px;text-align:center}
#ctat{color:#fff;font-weight:800;font-size:88px;line-height:1.12;letter-spacing:-1px}
#ctab{display:flex;align-items:center;gap:16px;border:3px solid #fff;border-radius:999px;padding:16px 34px;color:#fff;font-weight:700;font-size:44px}
#ctab svg{width:44px;height:44px}
#fadeout{position:absolute;inset:0;background:#031416;z-index:25}
"""


def build_main():
    caps, capdata = caption_html()
    # odômetro: 4 rodas (R$ 0.000); cada fita tem dígitos repetidos para girar muitas voltas
    reels = []
    for r in range(4):
        digits = "".join(f"<span>{d % 10}</span>" for d in range(0, 10 * (8 + r * 3) + 1))
        reels.append(f'<div class="reel"><div class="strip" id="strip{r}">{digits}</div></div>')
        if r == 0:
            reels.append('<span class="dot">.</span>')
    notifs = []
    for i, (title, ic) in enumerate(NOTIFS):
        extra = ""
        if ic == "star":
            extra = '<div class="stars">' + "".join(
                f'<svg viewBox="0 0 24 24"><path class="st-fill" id="st{j}" d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z" stroke-width="1.6"/></svg>'
                for j in range(5)) + "</div>"
        cls = "ic bat" if ic == "battery" else "ic"
        notifs.append(f'<div class="nt" id="nt{i}"><span class="{cls}">{ICON[ic]}</span><div class="tx">'
                      f'<span class="ap">Sua empresa · agora</span><span class="tt">{esc(title)}</span>{extra}</div></div>')
    keys = "".join(f'<div class="key" id="k{i}">{k}</div>' for i, k in enumerate("789÷C456×%123−="))

    js_consts = json.dumps(dict(T=T, PLIMS=PLIMS, CAP=json.loads(capdata)))
    html_doc = TEMPLATE
    for key, val in {
        "%%FONTS%%": FONTS, "%%BASE%%": BASE_CSS, "%%MAIN%%": MAIN_CSS, "%%TOTAL%%": f"{TOTAL}",
        "%%SPEECH_END%%": f"{SPEECH_END}", "%%OUTRO_IN%%": f"{OUTRO_IN}", "%%CTA_IN%%": f"{CTA_IN}",
        "%%REELS%%": "".join(reels), "%%NOTIFS%%": "".join(notifs), "%%KEYS%%": keys,
        "%%CAPS%%": caps, "%%CONSTS%%": js_consts, "%%ARROW%%": ICON["arrow"],
        "%%CHECK%%": svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', sw=3.2),
        "%%ICEBERG%%": ICEBERG_SVG,
    }.items():
        html_doc = html_doc.replace(key, val)
    return html_doc


ICEBERG_SVG = """<svg viewBox="0 0 1080 3400" preserveAspectRatio="none">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00696E"/><stop offset="1" stop-color="#00494F"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b3b40"/><stop offset=".35" stop-color="#16302f"/><stop offset="1" stop-color="#212829"/></linearGradient>
<linearGradient id="berg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a8a8f"/><stop offset=".55" stop-color="#00696E"/><stop offset="1" stop-color="#00494F"/></linearGradient>
<linearGradient id="tip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1F1F1"/><stop offset="1" stop-color="#D7E3E2"/></linearGradient>
</defs>
<rect x="0" y="0" width="1080" height="900" fill="url(#sky)"/>
<rect x="0" y="900" width="1080" height="2500" fill="url(#sea)"/>
<path d="M150 900 L290 700 L330 735 L380 640 L440 720 L500 690 L590 900 Z" fill="url(#tip)"/>
<path d="M330 735 L380 640 L400 900 L340 900 Z" fill="#c4d4d3" opacity=".7"/>
<path d="M150 900 L590 900 L760 1150 L900 1620 L860 2150 L700 2700 L430 2950 L210 2780 L90 2300 L60 1700 L110 1200 Z" fill="url(#berg)" opacity=".92"/>
<path d="M590 900 L760 1150 L900 1620 L860 2150 L700 2700 L600 2300 L640 1700 Z" fill="#00494F" opacity=".55"/>
<rect x="0" y="892" width="1080" height="16" fill="#7fb6b8" opacity=".55"/>
<g fill="#ffffff" opacity=".18"><circle cx="820" cy="1300" r="10"/><circle cx="860" cy="1180" r="6"/><circle cx="790" cy="1500" r="8"/><circle cx="960" cy="1900" r="12"/><circle cx="930" cy="2050" r="7"/><circle cx="180" cy="1400" r="9"/></g>
</svg>"""

TEMPLATE = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>O custo de uma vaga vazia</title>
<meta name="viewport" content="width=1080, height=1920">
<script src="assets/gsap.min.js"></script>
<style>
%%FONTS%%
%%BASE%%
%%MAIN%%
</style></head><body>
<div id="root" data-composition-id="reel" data-start="0" data-duration="%%TOTAL%%" data-width="1080" data-height="1920">

<div id="ice-c" class="clip" data-start="22.55" data-duration="9.0" data-track-index="2"><div id="ice"><div id="world">%%ICEBERG%%
<div class="lab" id="lab-fin">FINANCEIRO</div><div class="lab" id="lab-pro">PRODUTIVIDADE</div><div class="lab" id="lab-cli">CLIMA</div><div class="lab" id="lab-ret">RETENÇÃO</div>
</div></div></div>

<div id="cam"><div id="shake">
<video id="speaker" class="clip" src="assets/speaker.mp4" muted playsinline data-start="0" data-duration="%%SPEECH_END%%" data-track-index="0"></video>
</div></div>
<div id="winframe-c" class="clip" data-start="22.55" data-duration="9.0" data-track-index="3"><div id="winframe"></div></div>
<div id="dim-c" class="clip" data-start="11.95" data-duration="0.75" data-track-index="4"><div id="dim"></div></div>
<audio id="mix" src="assets/mix.wav" data-start="0" data-duration="%%TOTAL%%" data-track-index="1"></audio>

<div id="hook-c" class="clip" data-start="0" data-duration="4.45" data-track-index="5"><div id="hook">
<div id="hooktag">O CUSTO DE UMA VAGA VAZIA</div>
<div id="counter"><span class="rs">R$</span><div id="numbox"><div id="reels">%%REELS%%</div><div id="qqq"><span class="ybox" id="qbox">???</span></div></div></div>
</div></div>

<div id="receipt-c" class="clip" data-start="9.25" data-duration="3.05" data-track-index="6"><div id="receipt">
<div class="rh">RECIBO</div><div class="rs2">vaga em aberto</div><div class="rl"></div>
<div class="row"><span>Contratação</span><span>adiada</span></div>
<div class="row"><span>Vaga</span><span>em aberto</span></div>
<div class="rl"></div>
<div class="tot"><span>ECONOMIA: SALÁRIO</span><span class="ok">%%CHECK%%</span></div>
<div id="stamp">ECONOMIZADO</div>
</div></div>

<div id="notifs-c" class="clip" data-start="12.22" data-duration="10.38" data-track-index="7"><div id="notifs">%%NOTIFS%%</div></div>

<div id="calc-c" class="clip" data-start="35.40" data-duration="7.70" data-track-index="8"><div id="calc"><div id="calcin">
<div class="face" id="front"><div id="display"><span id="dtext"></span><span id="cursor"></span></div><div id="keys">%%KEYS%%</div></div>
<div class="face" id="back"><div>Fale com a <span class="ybox">Inovar</span></div></div>
</div></div></div>

%%CAPS%%

<div id="cta-c" class="clip" data-start="%%CTA_IN%%" data-duration="2.12" data-track-index="30"><div id="cta">
<svg class="curves" viewBox="0 0 1080 1920" preserveAspectRatio="none">
<path id="cv1" d="M-40 1500 C 280 1380 560 1680 1120 1430 L1120 1960 L-40 1960 Z" fill="#00696E"/>
<path id="cv2" d="M1120 -40 C 880 200 1040 330 760 440 C 590 510 640 120 1120 -40 Z" fill="#00696E" opacity=".7"/>
</svg>
<div id="ctac"><div id="ctat">Fale com a <span class="ybox">Inovar</span></div><div id="ctab">%%ARROW%% Link na bio</div></div>
</div></div>
<div id="fade-c" class="clip" data-start="44.55" data-duration="0.45" data-track-index="31"><div id="fadeout"></div></div>
<video id="outro" class="clip" src="assets/encerramento.mp4" muted playsinline data-start="%%OUTRO_IN%%" data-duration="5" data-track-index="40"></video>
</div>
<script>
const K = %%CONSTS%%;
const T = K.T, PLIMS = K.PLIMS;
function build(){
const tl = gsap.timeline({paused:true});
tl.set({}, {}, %%TOTAL%%);

// ---------------- GANCHO: odômetro acelera e trava em R$ ??? ----------------
tl.fromTo("#hooktag",{opacity:.0,y:-10},{opacity:1,y:0,duration:.25,ease:"power2.out"},0);
tl.fromTo("#counter",{scale:.86,opacity:.55},{scale:1,opacity:1,duration:.25,ease:"back.out(2)"},0);
tl.set("#qqq",{opacity:0},0);
const H = 76;
for (let r=0;r<4;r++){
  const n = document.querySelectorAll("#strip"+r+" span").length - 1;
  tl.fromTo("#strip"+r,{y:0},{y:-H*n,duration:T.counter_lock-0.05,ease:"power3.in"},0.05);
}
tl.set("#reels",{opacity:0},T.counter_lock);
tl.fromTo("#qqq",{opacity:0,scale:1.6},{opacity:1,scale:1,duration:.18,ease:"back.out(3)"},T.counter_lock);
[[10,-4],[-9,3],[7,4],[-5,-3],[3,2],[0,0]].forEach((d,i)=>tl.to("#counter",{x:d[0],y:d[1],duration:.04,ease:"none"},T.counter_lock+0.02+i*0.04));
tl.to("#hook",{y:-40,opacity:0,duration:.25,ease:"power2.in"},4.2);

// ---------------- CENA 2: recibo + carimbo ----------------
tl.fromTo("#receipt",{clipPath:"inset(0% 0% 100% 0%)",rotation:-4,y:-30},{clipPath:"inset(0% 0% 0% 0%)",y:0,duration:.6,ease:"power2.out"},9.30);
tl.fromTo("#stamp",{scale:2.2,opacity:0},{scale:1,opacity:1,duration:.16,ease:"power3.in"},T.chaching-0.12);
tl.to("#receipt",{y:6,duration:.05,yoyo:true,repeat:1,ease:"power1.out"},T.chaching+0.04);
// "Mas enquanto isso…": chicote, recibo arrancado, fundo escurece meio segundo
tl.to("#receipt",{x:-760,rotation:-28,filter:"blur(6px)",duration:.22,ease:"power3.in"},T.whoosh-0.2);
tl.to("#cam",{x:-302,y:-288,scale:1.3,filter:"blur(16px)",duration:.13,ease:"power2.in"},T.whoosh-0.13);
tl.set("#cam",{x:-22},T.whoosh);
tl.to("#cam",{x:0,y:0,scale:1,filter:"blur(0px)",duration:.18,ease:"power2.out"},T.whoosh);
tl.fromTo("#dim",{opacity:0},{opacity:.42,duration:.08},T.whoosh);
tl.to("#dim",{opacity:0,duration:.2},T.whoosh+0.5);

// ---------------- CENA 2: notificações empilhando ----------------
const NT = ["#nt0","#nt1","#nt2","#nt3","#nt4"];
NT.forEach((s,i)=>{
  const t = PLIMS[i];
  tl.fromTo(s,{y:-170,opacity:0,scale:1},{y:0,opacity:1,duration:.3,ease:"back.out(1.6)"},t-0.08);
  for (let j=0;j<i;j++){
    const depth = i-j;
    tl.to(NT[j],{y:-26*depth,scale:1-0.06*depth,opacity:Math.max(0,1-0.28*depth),duration:.25,ease:"power2.out"},t-0.08);
  }
});
tl.fromTo("#hand-m",{rotation:0,transformOrigin:"12px 12px"},{rotation:1440,duration:2.2,ease:"none",svgOrigin:"12 12"},PLIMS[1]);
tl.fromTo("#hand-h",{rotation:0},{rotation:120,duration:2.2,ease:"none",svgOrigin:"12 12"},PLIMS[1]);
// prazos estourando: tremida de câmera no impacto
[[14,-8],[-12,7],[9,9],[-7,-6],[5,4],[-3,-2],[0,0]].forEach((d,i)=>tl.to("#shake",{x:d[0],y:d[1],duration:.04,ease:"none"},T.impact+0.01+i*0.04));
tl.to("#nt2",{rotation:-2,duration:.05,yoyo:true,repeat:3},T.impact);
// atendimento: 5 estrelas caem para 2 em "piorar"
["#st4","#st3","#st2"].forEach((s,i)=>{
  tl.to(s,{y:26,opacity:.0,duration:.22,ease:"power2.in"},18.70+i*0.09);
});
// desgaste: bateria descarrega até quase vazia
tl.fromTo("#batfill",{attr:{width:20.6}},{attr:{width:2.2},duration:2.7,ease:"power1.in"},PLIMS[4]+0.2);
tl.to("#batfill",{attr:{fill:"#FFCE23"},duration:.2},21.6);
// a pilha treme e cai
[[8,0],[-8,0],[6,0],[-6,0],[0,0]].forEach((d,i)=>tl.to("#notifs",{x:d[0],duration:.045,ease:"none"},21.93+i*0.045));
tl.to("#notifs",{y:1100,rotation:9,duration:.4,ease:"power3.in"},22.16);

// ---------------- CENA 3: iceberg ----------------
const WIN = "inset(330px 300px 920px 300px round 48px)", FULL = "inset(0px 0px 0px 0px round 0px)";
tl.fromTo("#ice",{opacity:0},{opacity:1,duration:.3,ease:"power1.out"},22.58);
tl.fromTo("#cam",{x:0,y:0,scale:1,clipPath:FULL},{x:360,y:6,scale:.8,clipPath:WIN,duration:.5,ease:"power3.inOut"},22.58);
tl.fromTo("#winframe",{opacity:0,scale:.92},{opacity:1,scale:1,duration:.25,ease:"power2.out"},23.0);
tl.fromTo("#world",{y:-120},{y:0,duration:1.0,ease:"power2.out"},22.58);
tl.fromTo("#lab-fin",{opacity:0,y:20},{opacity:1,y:0,duration:.25,ease:"back.out(2)"},25.98);
tl.to("#world",{y:-1500,duration:1.0,ease:"power2.inOut"},26.86);
tl.fromTo("#lab-pro",{opacity:0,x:-60},{opacity:1,x:0,duration:.28,ease:"back.out(2)"},27.85);
tl.fromTo("#lab-cli",{opacity:0,x:-60},{opacity:1,x:0,duration:.28,ease:"back.out(2)"},29.11);
tl.fromTo("#lab-ret",{opacity:0,x:-60,scale:.9},{opacity:1,x:0,scale:1,duration:.3,ease:"back.out(2.4)"},29.67);
tl.to("#winframe",{opacity:0,duration:.15},31.05);
tl.to("#ice",{y:400,opacity:0,duration:.45,ease:"power2.in"},31.05);
tl.to("#cam",{x:-43,y:-58,scale:1.08,clipPath:FULL,duration:.45,ease:"power3.inOut"},31.05);
tl.to("#cam",{x:0,y:0,scale:1,duration:.7,ease:"power2.out"},31.50);

// ---------------- CENA 4: calculadora ----------------
tl.fromTo("#calc",{y:700,opacity:0},{y:0,opacity:1,duration:.35,ease:"back.out(1.4)"},35.40);
const msg = "CUSTO DE NÃO CONTRATAR = ";
const typeStart = T.calc, typeEnd = 37.05;
for (let i=1;i<=msg.length;i++){
  tl.set("#dtext",{textContent:msg.slice(0,i)}, typeStart + (typeEnd-typeStart)*(i-1)/msg.length);
}
tl.set("#dtext",{textContent:msg+"?"},typeEnd+0.05);
[0,.16,.27,.43,.55,.76,.88,1.12].forEach((o,i)=>{
  const k = "#k"+[2,7,11,4,9,1,13,6][i];
  tl.to(k,{backgroundColor:"#FFFFFF",color:"#00494F",duration:.04},T.calc+o);
  tl.to(k,{backgroundColor:"#00696E",color:"#FFFFFF",duration:.12},T.calc+o+0.08);
});
for (let b=0;b<14;b++){ tl.set("#cursor",{opacity:b%2?1:0},typeStart+0.25*b); }
tl.fromTo("#calcin",{rotationY:0},{rotationY:180,duration:.55,ease:"power2.inOut"},T.spark-0.12);
tl.fromTo("#calc",{scale:1},{scale:1.06,duration:.28,yoyo:true,repeat:1,ease:"power1.inOut"},T.spark-0.12);

// ---------------- CTA: a calculadora vira a cartela ----------------
tl.fromTo("#cta",{clipPath:"inset(840px 270px 660px 270px round 36px)"},{clipPath:"inset(0px 0px 0px 0px round 0px)",duration:.22,ease:"power2.in"},%%CTA_IN%%);
tl.fromTo("#ctat",{y:30,opacity:0},{y:0,opacity:1,duration:.3,ease:"back.out(1.8)"},%%CTA_IN%%+0.2);
tl.fromTo("#ctab",{y:24,opacity:0},{y:0,opacity:1,duration:.28,ease:"power2.out"},%%CTA_IN%%+0.42);
tl.fromTo("#ctab svg",{y:4},{y:-6,duration:.3,yoyo:true,repeat:3,ease:"sine.inOut"},%%CTA_IN%%+0.7);
tl.fromTo("#cv1",{y:140},{y:0,duration:.7,ease:"power2.out"},%%CTA_IN%%+0.1);
tl.fromTo("#cv2",{x:220,opacity:0},{x:0,opacity:.7,duration:.6,ease:"power2.out"},%%CTA_IN%%+0.1);
tl.fromTo("#fadeout",{opacity:0},{opacity:1,duration:.4,ease:"power1.in"},44.57);

// ---------------- LEGENDAS: caixa teal desliza de palavra em palavra ----------------
K.CAP.forEach(c=>{
  const line = document.getElementById("capl"+c.g), mv = document.getElementById("mv"+c.g);
  const lr = line.getBoundingClientRect();
  const box = (i)=>{ const r = document.getElementById("c"+c.g+"w"+i).getBoundingClientRect();
    return {x:r.left-lr.left-6, y:r.top-lr.top-14, width:r.width+12, height:r.height-6}; };
  tl.fromTo(line,{opacity:0,y:16},{opacity:1,y:0,duration:.14,ease:"power2.out"},c.start);
  const b0 = box(0);
  tl.set(mv,{x:b0.x,y:b0.y,width:b0.width,height:b0.height,opacity:c.kw[0]?0:1},c.start);
  c.words.forEach((t,i)=>{ if(i===0) return; const b = box(i);
    tl.to(mv,{x:b.x,y:b.y,width:b.width,height:b.height,opacity:c.kw[i]?0:1,duration:.12,ease:"power2.out"},t-0.06); });
});
return tl;
}
Promise.all([400,700,800,900].map(w=>document.fonts.load(w+" 62px Montserrat"))).then(()=>document.fonts.ready).then(()=>{
  window.__timelines["reel"] = build();
});
</script>
</body></html>
"""


def build_cover():
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Capa do Reel</title>
<meta name="viewport" content="width=1080, height=1920">
<script src="assets/gsap.min.js"></script>
<style>
{FONTS}
{BASE_CSS}
#photo{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
#grad{{position:absolute;inset:0;background:linear-gradient(0deg,#00494F 0%,rgba(0,73,79,.92) 22%,rgba(0,73,79,.55) 38%,rgba(0,73,79,0) 50%)}}
#title{{position:absolute;left:0;right:0;top:1056px;height:384px;display:flex;align-items:center;justify-content:center}}
#tbox{{width:900px;text-align:center;color:#fff;font-weight:400;font-size:96px;line-height:1.14;letter-spacing:-1px;text-shadow:0 4px 22px rgba(0,0,0,.35)}}
#tbox .ybox{{font-weight:800;text-shadow:none;padding:0 .16em}}
</style></head><body>
<div id="root" data-composition-id="cover" data-start="0" data-duration="1" data-width="1080" data-height="1920">
<img id="photo" class="clip" src="cover-photo.png" alt="" data-start="0" data-duration="1" data-track-index="0">
<div id="grad" class="clip" data-start="0" data-duration="1" data-track-index="1"></div>
<div id="title" class="clip" data-start="0" data-duration="1" data-track-index="2"><div id="tbox">Quanto custa uma <span class="ybox">VAGA VAZIA</span> na sua empresa?</div></div>
</div>
<script>
const tl = gsap.timeline({{paused:true}});
tl.set({{}},{{}},1);
window.__timelines["cover"] = tl;
</script>
</body></html>
"""


open(os.path.join(HERE, "index.html"), "w").write(build_main())
os.makedirs(os.path.join(HERE, "cover"), exist_ok=True)
open(os.path.join(HERE, "cover/index.html"), "w").write(build_cover())
print("ok")
