"""Gera index.html (Reel 03, vaga Auxiliar de Serviços Gerais) e cover/index.html (capa).

Tempos: fala no corte aprovado (../work/transcript-cut.json, conferida) e efeitos da etapa 2
(../work/sfx-cues.json). O telefone é sempre PHONE, nunca digitado à mão em outro lugar.
Rode: python3 -I build_reel.py
"""
import json, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
PHONE = "(31) 97231-7190"
CARGO = "AUXILIAR DE SERVIÇOS GERAIS"
SPEECH_END = 38.95
CTA_IN = 38.95
OUTRO_IN = 40.95
TOTAL = 45.95          # = mix.wav

cues = json.load(open(os.path.join(HERE, "../work/sfx-cues.json")))["cues"]
C = {}
for c in cues:
    C.setdefault(c["sfx"], []).append(c["t"])
T = dict(alert=C["alerta"][0], stamp=C["carimbo"][0], type=C["maquina"][0], pops=C["pop"],
         plane=C["aviaozinho"][0], keys=C["teclas"][0], ding=C["relogio"][0])
FICHA_IN, FICHA_OUT = 10.40, 25.00
PHONE_IN = T["keys"] - 0.14

# ---------- legendas pop: 1 a 3 palavras; ** = palavra-chave (caixa amarela) ----------
CAPTIONS = [
    [("Se", 0.30), ("você", 1.03)],
    [("está", 1.37), ("procurando", 1.57)],
    [("uma", 2.05), ("oportunidade", 2.23)],
    [("de", 2.89), ("emprego,", 3.21)],
    [("presta", 3.90), ("atenção", 4.06)],
    [("nessa", 4.36), ("**vaga.", 4.68)],
    [("A", 4.88), ("Inovar", 5.36)],
    [("Recursos", 5.71), ("Humanos", 6.12)],
    [("está", 6.55), ("com", 6.74), ("uma", 6.89)],
    [("oportunidade", 7.01), ("aberta", 7.66)],
    [("para", 8.18), ("a", 8.41), ("**vaga", 8.55)],
    [("de", 8.70)],
    [("**Auxiliar", 8.84), ("**de", 9.15), ("**Serviços", 9.34), ("**Gerais.", 9.71)],
    [("A", 10.46), ("jornada", 10.62)],
    [("é", 11.08), ("de", 11.24)],
    [("36", 11.52), ("horas", 12.06)],
    [("semanais,", 12.50)],
    [("de", 13.38), ("segunda", 13.52)],
    [("a", 13.82), ("sexta-feira,", 13.98)],
    [("em", 14.80), ("horário", 14.92)],
    [("comercial.", 15.26)],
    [("Para", 16.05), ("participar,", 16.23)],
    [("é", 17.27), ("necessário", 17.31)],
    [("ter", 17.73), ("**experiência", 17.97)],
    [("na", 18.53), ("função", 18.73)],
    [("e", 19.19), ("disponibilidade", 19.46)],
    [("para", 20.28), ("atuar", 20.48)],
    [("em", 20.74), ("condomínios", 20.94)],
    [("e", 21.52), ("empresas.", 21.70)],
    [("O", 22.30), ("salário", 22.55)],
    [("será", 23.03), ("combinado", 23.29)],
    [("durante", 23.85), ("o", 24.23), ("processo", 24.43)],
    [("seletivo.", 24.73)],
    [("Se", 25.50), ("você", 25.66), ("tem", 26.16)],
    [("esse", 26.36), ("perfil", 26.64)],
    [("ou", 27.23), ("conhece", 27.54)],
    [("alguém", 27.91), ("que", 28.20), ("já", 28.38)],
    [("está", 28.64), ("procurando", 28.89)],
    [("uma", 29.25), ("oportunidade,", 29.41)],
    [("já", 30.49), ("**compartilha", 30.73)],
    [("esse", 31.23), ("vídeo.", 31.41)],
    [("Para", 31.79), ("se", 32.14), ("candidatar,", 32.38)],
    [("envia", 33.50), ("**agora", 33.84)],
    [("o", 34.50), ("seu", 34.76), ("**currículo", 34.98)],
    [("pelo", 35.50), ("**WhatsApp", 35.74)],
    [("da", 36.20), ("Inovar.", 36.44)],
    [("Não", 37.43), ("deixe", 37.71)],
    [("para", 38.15), ("depois.", 38.31)],
]


def esc(s):
    return html.escape(s, quote=False)


def caption_html():
    out, data = [], []
    for gi, grp in enumerate(CAPTIONS):
        start = grp[0][1] - 0.04
        nxt = CAPTIONS[gi + 1][0][1] - 0.04 if gi + 1 < len(CAPTIONS) else SPEECH_END
        end = min(nxt, grp[-1][1] + 0.8) if nxt - grp[-1][1] > 1.1 else nxt
        zone = "low" if FICHA_IN <= start < FICHA_OUT else ("dim" if start >= PHONE_IN else "")
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
        out.append(f'<div id="cap{gi}" class="clip cap {zone}" data-start="{start:.3f}" data-duration="{end - start:.3f}" '
                   f'data-track-index="20"><div class="capline" id="capl{gi}">{" ".join(spans)}</div></div>')
        data.append({"g": gi, "start": round(start, 3), "end": round(end, 3), "words": [round(t, 3) for _, t in grp],
                     "kw": [w.startswith("**") for w, _ in grp]})
    return "\n".join(out), data


def svg(body, vb="0 0 24 24", sw=2.2, stroke="#fff"):
    return (f'<svg viewBox="{vb}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{body}</svg>')


ICON = {
    "clock": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    "calendar": svg('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13h2M12 13h2M16 13h0M8 16.5h2M12 16.5h2"/>'),
    "star": svg('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z"/>', sw=2),
    "building": svg('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M11 21v-3h2v3"/>'),
    "money": '<span class="ic-text">R$</span>',
    "plane": svg('<path d="M21.5 3 10.2 14.3"/><path d="M21.5 3 14.6 21l-4.4-6.7L3.5 9.9Z"/>', sw=2.2, stroke="#00494F"),
    "doc": svg('<path d="M14 3H7a1.8 1.8 0 0 0-1.8 1.8v14.4A1.8 1.8 0 0 0 7 21h10a1.8 1.8 0 0 0 1.8-1.8V7.8Z"/><path d="M14 3v4.8h4.8"/><path d="m9 14 2.2 2.2L15.5 12"/>', stroke="#00494F", sw=2),
    "hourglass": svg('<path d="M7 3h10M7 21h10M8 3c0 4.5 8 4.5 8 9s-8 4.5-8 9M16 3c0 4.5-8 4.5-8 9s8 4.5 8 9"/>', stroke="#00494F", sw=2),
    "down": svg('<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>', stroke="#00494F", sw=2.8),
}
ROWS = [("clock", "36 horas semanais"), ("calendar", "Segunda a sexta"), ("star", "Experiência na função"),
        ("building", "Condomínios e empresas"), ("money", "Salário a combinar")]

FONTS = "".join(
    f"@font-face{{font-family:'Montserrat';font-weight:{w};font-style:normal;src:url('assets/fonts/montserrat-latin-{w}-normal.woff2') format('woff2')}}"
    for w in (400, 700, 800, 900)) + \
    "@font-face{font-family:'Bebas Neue';font-weight:400;font-style:normal;src:url('assets/fonts/bebas-neue-latin-400-normal.woff2') format('woff2')}"

BASE_CSS = """
:root{--ink:#212829;--teal-deep:#00494F;--teal:#00696E;--mist:#D7E3E2;--paper:#F1F1F1;--yellow:#FFCE23;--wa:#25D366}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:'Montserrat',sans-serif}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#000}
.ybox{display:inline-block;background:var(--yellow);color:var(--teal-deep);padding:0 .16em;border-radius:.12em}
.bebas{font-family:'Bebas Neue',sans-serif;font-weight:400;letter-spacing:.02em}
"""

MAIN_CSS = """
#cam{position:absolute;inset:0;transform-origin:50% 30%;z-index:1}
#shake{position:absolute;inset:0}
#speaker{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#flash{position:absolute;inset:0;background:#fff;z-index:15}
/* ticker */
#ticker{position:absolute;left:0;right:0;top:262px;height:58px;background:var(--teal-deep);overflow:hidden;z-index:5;border-top:3px solid var(--teal);border-bottom:3px solid var(--teal)}
#tickin{position:absolute;left:0;top:0;white-space:nowrap;color:#fff;font-weight:800;font-size:34px;line-height:52px;letter-spacing:.12em}
#tickin b{color:var(--yellow);font-weight:900;padding:0 .4em}
/* carimbo */
#stamp{position:absolute;left:0;right:0;top:1010px;display:flex;justify-content:center;z-index:6}
#stamp span{display:block;background:var(--yellow);color:var(--teal-deep);font-weight:900;font-size:104px;letter-spacing:.04em;padding:14px 42px;border-radius:18px;border:8px solid var(--teal-deep);box-shadow:0 18px 50px rgba(0,0,0,.35);transform:rotate(-8deg)}
/* cargo */
#band{position:absolute;left:70px;right:70px;top:262px;height:118px;background:var(--teal-deep);border-radius:20px;z-index:6;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 40px rgba(0,0,0,.35);transform-origin:50% 0}
#cargo{color:#fff;font-size:92px;line-height:1;white-space:nowrap}
#uline{position:absolute;left:40px;right:40px;bottom:14px;height:8px;border-radius:4px;background:var(--yellow);transform-origin:0 50%}
/* ficha */
#ficha{position:absolute;left:100px;right:110px;top:900px;background:#fff;border-radius:34px;box-shadow:0 20px 50px rgba(0,0,0,.35);padding:20px 28px 18px;z-index:6;transform-origin:0 50%;overflow:hidden}
#fhead{background:var(--teal-deep);border-radius:20px;padding:10px 18px 6px;text-align:center;position:relative;height:82px;box-sizing:border-box}
#fhead .t{color:#fff;font-size:62px;line-height:1}
#fhead .u{position:absolute;left:24px;right:24px;bottom:6px;height:5px;border-radius:3px;background:var(--yellow)}
.frow{display:flex;align-items:center;gap:18px;height:68px;margin-top:4px}
.frow .ic{width:56px;height:56px;flex:0 0 56px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center}
.frow .ic svg{width:36px;height:36px}
.ic-text{color:#fff;font-weight:900;font-size:24px}
.frow .tx{color:var(--teal-deep);font-weight:800;font-size:37px;letter-spacing:-.3px;white-space:nowrap}
.frow .tx i{font-style:normal;font-weight:700;color:var(--teal)}
/* aviãozinho */
#plane-layer{position:absolute;inset:0;z-index:6}
#trail{position:absolute;inset:0;width:1080px;height:1920px}
#plane{position:absolute;left:0;top:0;width:110px;height:110px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}
#plane svg{width:64px;height:64px}
#tag{position:absolute;left:180px;top:1110px;display:flex;align-items:center;gap:12px;background:#fff;color:var(--teal-deep);font-weight:800;font-size:44px;padding:16px 30px;border-radius:999px;box-shadow:0 12px 34px rgba(0,0,0,.3)}
#tag svg{width:44px;height:44px}
/* currículo + telefone */
#doc{position:absolute;left:150px;top:900px;width:170px;height:200px;background:#fff;border-radius:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 40px rgba(0,0,0,.35);z-index:6}
#doc svg{width:110px;height:110px}
#phone{position:absolute;left:100px;right:110px;top:880px;height:330px;background:#fff;border-radius:40px;box-shadow:0 22px 56px rgba(0,0,0,.4);z-index:7;display:flex;align-items:center;gap:30px;padding:0 36px;transform-origin:50% 50%}
#wa{width:150px;height:150px;flex:0 0 150px;border-radius:50%;background:var(--wa);display:flex;align-items:center;justify-content:center}
#wa img{width:92px;height:92px}
#pcol{display:flex;flex-direction:column;gap:8px}
#plabel{color:var(--teal);font-weight:700;font-size:34px}
#pnum{position:relative;display:inline-block;font-weight:800;font-size:66px;color:var(--teal-deep);letter-spacing:-.5px;white-space:nowrap;padding:2px 12px;border-radius:12px}
#pbox{position:absolute;inset:0;background:var(--yellow);border-radius:12px;z-index:-1}
#pcur{display:inline-block;width:5px;height:60px;background:var(--teal-deep);vertical-align:-8px;margin-left:4px}
#hg{position:absolute;right:-26px;top:-56px;width:110px;height:110px;border-radius:50%;background:#fff;border:6px solid var(--teal);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.3)}
#hg svg{width:62px;height:62px}
/* legendas */
.cap{position:absolute;left:110px;right:120px;top:1300px;height:220px;display:flex;align-items:center;justify-content:center;z-index:10}
.cap.low{top:1432px;height:100px}
.cap.low .capline{font-size:50px}
.cap.dim{opacity:.55}
.capline{text-align:center;color:#fff;font-weight:800;font-size:70px;line-height:1.15;letter-spacing:-.5px;-webkit-text-stroke:7px #00393d;paint-order:stroke fill;text-shadow:0 6px 18px rgba(0,0,0,.45)}
.w{display:inline-block}
.kwbox{display:inline-block;background:var(--yellow);border-radius:.16em;padding:0 .14em;-webkit-text-stroke:0;text-shadow:none;box-shadow:0 6px 16px rgba(0,0,0,.3)}
.kwbox .w{color:var(--teal-deep);-webkit-text-stroke:0}
/* CTA */
#cta{position:absolute;inset:0;background:var(--teal-deep);z-index:20;overflow:hidden}
#cta svg.curves{position:absolute;inset:0;width:100%;height:100%}
#ctac{position:absolute;left:100px;right:100px;top:520px;display:flex;flex-direction:column;align-items:center;gap:34px;text-align:center}
#ctaseal{background:var(--teal);color:#fff;font-weight:800;font-size:34px;letter-spacing:.18em;padding:10px 26px;border-radius:999px}
#ctat{color:#fff;font-size:150px;line-height:.92}
#ctasub{color:#fff;font-weight:400;font-size:48px}
#ctaph{display:flex;align-items:center;gap:20px}
#ctaph .wa2{width:96px;height:96px;border-radius:50%;background:var(--wa);display:flex;align-items:center;justify-content:center}
#ctaph .wa2 img{width:58px;height:58px}
#ctaph .ybox{font-weight:800;font-size:62px;padding:6px 18px;border-radius:14px}
#ctafade{position:absolute;inset:0;background:var(--teal-deep);z-index:21}
#outro-w{position:absolute;inset:0;z-index:30}
#outro{position:absolute;inset:0;width:100%;height:100%}
"""


def build_main():
    caps, capdata = caption_html()
    rows = "".join(
        f'<div class="frow" id="row{i}"><span class="ic">{ICON[ic]}</span><span class="tx">{esc(tx)}'
        + ('<i id="row1b"> · Horário comercial</i>' if i == 1 else "") + "</span></div>"
        for i, (ic, tx) in enumerate(ROWS))
    ticker = ("VAGA ABERTA<b>•</b>" * 14)
    cargo_spans = "".join(f'<span class="ch" id="ch{i}">{esc(c) if c != " " else "&nbsp;"}</span>' for i, c in enumerate(CARGO))
    phone_spans = "".join(f'<span class="pd" id="pd{i}">{esc(c) if c != " " else "&nbsp;"}</span>' for i, c in enumerate(PHONE))
    consts = dict(T=T, CAP=capdata, PHONE=PHONE, CARGO=CARGO, FICHA_IN=FICHA_IN, FICHA_OUT=FICHA_OUT, PHONE_IN=PHONE_IN,
                  CTA_IN=CTA_IN, OUTRO_IN=OUTRO_IN)
    doc = TEMPLATE
    for k, v in {"%%FONTS%%": FONTS, "%%BASE%%": BASE_CSS, "%%MAIN%%": MAIN_CSS, "%%TOTAL%%": f"{TOTAL}",
                 "%%SPEECH_END%%": f"{SPEECH_END}", "%%OUTRO_IN%%": f"{OUTRO_IN}", "%%CTA_IN%%": f"{CTA_IN}",
                 "%%TICKER%%": ticker, "%%CARGO%%": cargo_spans, "%%ROWS%%": rows, "%%PHONE%%": phone_spans,
                 "%%PHONE_TXT%%": esc(PHONE), "%%CAPS%%": caps, "%%CONSTS%%": json.dumps(consts, ensure_ascii=False),
                 "%%PLANE%%": ICON["plane"], "%%DOC%%": ICON["doc"], "%%HG%%": ICON["hourglass"], "%%DOWN%%": ICON["down"],
                 "%%CARGO1%%": "AUXILIAR DE", "%%CARGO2%%": "SERVIÇOS GERAIS",
                 "%%FICHA_IN%%": f"{FICHA_IN - 0.05:.2f}", "%%FICHA_DUR%%": f"{FICHA_OUT + 0.5 - FICHA_IN + 0.05:.2f}",
                 "%%PHONE_IN%%": f"{PHONE_IN:.2f}", "%%PHONE_DUR%%": f"{CTA_IN + 0.3 - PHONE_IN:.2f}"}.items():
        doc = doc.replace(k, v)
    return doc


TEMPLATE = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Vaga: Auxiliar de Serviços Gerais</title>
<meta name="viewport" content="width=1080, height=1920">
<script src="assets/gsap.min.js"></script>
<style>
%%FONTS%%
%%BASE%%
%%MAIN%%
</style></head><body>
<div id="root" data-composition-id="reel" data-start="0" data-duration="%%TOTAL%%" data-width="1080" data-height="1920">
<div id="cam"><div id="shake">
<video id="speaker" class="clip" src="assets/speaker.mp4" muted playsinline data-start="0" data-duration="%%SPEECH_END%%" data-track-index="0"></video>
</div></div>
<audio id="mix" src="assets/mix.wav" data-start="0" data-duration="%%TOTAL%%" data-track-index="1"></audio>

<div id="ticker-c" class="clip" data-start="0" data-duration="5.2" data-track-index="4"><div id="ticker"><div id="tickin">%%TICKER%%</div></div></div>
<div id="stamp-c" class="clip" data-start="4.45" data-duration="1.75" data-track-index="5"><div id="stamp"><span>VAGA ABERTA</span></div></div>
<div id="flash-c" class="clip" data-start="4.66" data-duration="0.12" data-track-index="6"><div id="flash"></div></div>

<div id="band-c" class="clip" data-start="8.70" data-duration="2.05" data-track-index="7"><div id="band"><div id="cargo" class="bebas">%%CARGO%%</div><div id="uline"></div></div></div>

<div id="ficha-c" class="clip" data-start="%%FICHA_IN%%" data-duration="%%FICHA_DUR%%" data-track-index="8"><div id="ficha">
<div id="fhead"><div class="t bebas">%%CARGO1%% %%CARGO2%%</div><div class="u"></div></div>
%%ROWS%%
</div></div>

<div id="plane-c" class="clip" data-start="30.45" data-duration="2.25" data-track-index="9"><div id="plane-layer">
<svg id="trail" viewBox="0 0 1080 1920"><path id="trailp" d="M150 1270 C 330 1180, 470 1300, 620 1150 S 860 960, 900 940" fill="none" stroke="#00696E" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 22"/></svg>
<div id="plane">%%PLANE%%</div>
<div id="tag">Marque quem precisa ver %%DOWN%%</div>
</div></div>

<div id="doc-c" class="clip" data-start="34.80" data-duration="1.25" data-track-index="10"><div id="doc">%%DOC%%</div></div>
<div id="phone-c" class="clip" data-start="%%PHONE_IN%%" data-duration="%%PHONE_DUR%%" data-track-index="11"><div id="phone">
<div id="wa"><img src="assets/whatsapp-white.svg" alt="WhatsApp"></div>
<div id="pcol"><div id="plabel">WhatsApp da Inovar</div><div><span id="pnum"><span id="pbox"></span>%%PHONE%%<span id="pcur"></span></span></div></div>
<div id="hg">%%HG%%</div>
</div></div>

%%CAPS%%

<div id="cta-c" class="clip" data-start="38.78" data-duration="2.17" data-track-index="30"><div id="cta">
<svg class="curves" viewBox="0 0 1080 1920" preserveAspectRatio="none">
<path id="cv1" d="M-40 1520 C 280 1400 560 1700 1120 1450 L1120 1960 L-40 1960 Z" fill="#00696E"/>
<path id="cv2" d="M1120 -40 C 880 200 1040 330 760 440 C 590 510 640 120 1120 -40 Z" fill="#00696E" opacity=".7"/>
</svg>
<div id="ctac">
<div id="ctaseal">VAGA ABERTA</div>
<div id="ctat" class="bebas"><div>%%CARGO1%%</div><div>%%CARGO2%%</div></div>
<div id="ctasub">Envie seu currículo</div>
<div id="ctaph"><span class="wa2"><img src="assets/whatsapp-white.svg" alt="WhatsApp"></span><span class="ybox" id="ctanum">%%PHONE_TXT%%</span></div>
</div>
<div id="ctafade"></div>
</div></div>
<div id="outro-w"><video id="outro" class="clip" src="assets/encerramento.mp4" muted playsinline data-start="%%OUTRO_IN%%" data-duration="5" data-track-index="40"></video></div>
</div>
<script>
const K = %%CONSTS%%, T = K.T;
function build(){
const tl = gsap.timeline({paused:true});
tl.set({}, {}, %%TOTAL%%);
// ---------------- GANCHO: ticker + carimbo ----------------
const tw = document.getElementById("tickin").scrollWidth/2;
tl.fromTo("#ticker",{scaleY:.6},{scaleY:1,duration:.2,ease:"back.out(2)"},0);
tl.fromTo("#tickin",{x:0},{x:-tw,duration:9,ease:"none"},0);
tl.to("#ticker",{y:-90,opacity:0,duration:.25,ease:"power2.in"},4.9);
tl.fromTo("#ticker",{scaleY:1},{scaleY:1.15,duration:.08,yoyo:true,repeat:3,ease:"none"},T.alert);
tl.fromTo("#stamp span",{y:-60,scale:2.1,rotation:-16,opacity:0},{y:0,scale:1,rotation:-8,opacity:1,duration:.2,ease:"power4.in"},T.stamp-0.2);
tl.fromTo("#flash",{opacity:0},{opacity:.85,duration:.0001},T.stamp);
tl.set("#flash",{opacity:0},T.stamp+0.067);
[[16,-10],[-14,9],[11,8],[-8,-6],[5,4],[-3,-2],[0,0]].forEach((d,i)=>tl.to("#shake",{x:d[0],y:d[1],duration:.04,ease:"none"},T.stamp+0.01+i*0.04));
tl.to("#stamp span",{scale:.6,opacity:0,duration:.25,ease:"back.in(2)"},5.9);

// ---------------- CENA 2: cargo digitado + ficha ----------------
tl.fromTo("#band",{scaleY:0,opacity:0},{scaleY:1,opacity:1,duration:.18,ease:"power2.out"},8.72);
const chars = document.querySelectorAll("#cargo .ch");
chars.forEach(c=>tl.set(c,{opacity:0},0));
const tEnd = 10.10;
chars.forEach((c,i)=>tl.set(c,{opacity:1},T.type+(tEnd-T.type)*i/chars.length));
tl.fromTo("#uline",{scaleX:0},{scaleX:1,duration:.25,ease:"power2.out"},10.14);
// o cargo encolhe e desce para virar o título da ficha
tl.to("#band",{y:628,scale:.86,duration:.4,ease:"power3.inOut"},K.FICHA_IN-0.05);
tl.to("#band",{opacity:0,duration:.12},K.FICHA_IN+0.32);
// a ficha cresce linha a linha: altura = cabeçalho + linhas visíveis (medidas fixas do CSS)
const HEAD_H = 20 + 82 + 18, ROW_H = 72;
tl.fromTo("#ficha",{height:HEAD_H,opacity:0},{opacity:1,duration:.3,ease:"power2.out"},K.FICHA_IN+0.2);
tl.fromTo("#fhead .u",{scaleX:0},{scaleX:1,duration:.3,ease:"power2.out"},K.FICHA_IN+0.45);
document.querySelectorAll(".frow").forEach(r=>tl.set(r,{opacity:0},0));
tl.set("#row1b",{opacity:0},0);
const rowT = [T.pops[0],T.pops[1],T.pops[3],T.pops[4],T.pops[5]];
rowT.forEach((t,i)=>{
  tl.to("#ficha",{height:HEAD_H+ROW_H*(i+1),duration:.2,ease:"power2.out"},t-0.06);
  tl.fromTo("#row"+i,{opacity:0,x:-50,scale:.9},{opacity:1,x:0,scale:1,duration:.22,ease:"back.out(2.4)"},t-0.04);
  tl.fromTo("#row"+i+" .ic",{scale:0,rotation:-40},{scale:1,rotation:0,duration:.25,ease:"back.out(3)"},t);
  tl.to("#cam",{scale:"+=0.018",duration:.07,yoyo:true,repeat:1,ease:"power1.out"},t);
});
tl.fromTo("#row1b",{opacity:0,y:10},{opacity:1,y:0,duration:.2,ease:"back.out(2)"},T.pops[2]-0.03);
tl.to("#cam",{scale:1.07,duration:K.FICHA_OUT-K.FICHA_IN,ease:"none"},K.FICHA_IN);
tl.to("#ficha",{x:-1150,scale:.7,rotation:-6,duration:.42,ease:"back.in(1.4)"},K.FICHA_OUT);
tl.to("#cam",{scale:1,duration:.5,ease:"power2.inOut"},K.FICHA_OUT+0.05);

// ---------------- CENA 3: aviãozinho com rastro ----------------
const path = document.getElementById("trailp"), L = path.getTotalLength();
const prog = {p:0};
const STEPS = 18, t0 = T.plane-0.05, t1 = T.plane+0.6;
for (let i=0;i<=STEPS;i++){
  const f = i/STEPS, pt = path.getPointAtLength(L*f), pt2 = path.getPointAtLength(Math.min(L, L*f+4));
  const ang = Math.atan2(pt2.y-pt.y, pt2.x-pt.x)*180/Math.PI + 45;
  tl.to("#plane",{x:pt.x-55,y:pt.y-55,rotation:ang,duration:(t1-t0)/STEPS,ease:"none"}, t0+(t1-t0)*(i-1)/STEPS);
}
tl.set("#plane",{x:150-55,y:1270-55,opacity:0},0);
tl.to("#plane",{opacity:1,duration:.08},t0);
tl.fromTo("#trail",{clipPath:"inset(0% 100% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",duration:t1-t0,ease:"none"},t0);
tl.fromTo("#tag",{scale:0,opacity:0,transformOrigin:"90% 0%"},{scale:1,opacity:1,duration:.28,ease:"back.out(2.4)"},t1-0.05);
tl.fromTo("#tag svg",{y:-4},{y:6,duration:.3,yoyo:true,repeat:3,ease:"sine.inOut"},t1+0.2);
tl.to(["#tag","#trail","#plane"],{opacity:0,duration:.25},32.4);

// ---------------- CENA 4: currículo + telefone digitado ----------------
tl.fromTo("#doc",{y:500,opacity:0,rotation:-10},{y:0,opacity:1,rotation:0,duration:.35,ease:"back.out(1.6)"},34.86);
tl.to("#doc",{scale:.4,x:120,y:60,opacity:0,duration:.25,ease:"power2.in"},35.75);
tl.fromTo("#phone",{y:700,opacity:0},{y:0,opacity:1,duration:.32,ease:"back.out(1.3)"},K.PHONE_IN);
const pd = document.querySelectorAll("#pnum .pd");
pd.forEach(d=>tl.set(d,{display:"none"},0));
tl.set("#pbox",{opacity:0},0); tl.set("#hg",{scale:0},0);
// um toque por dígito (0,1 s); parênteses, espaço e hífen aparecem junto do dígito seguinte
let di = 0;
pd.forEach((d,i)=>{ const isDigit = /[0-9]/.test(K.PHONE[i]);
  const t = T.keys + 0.1*(isDigit ? di : di);
  tl.set(d,{display:"inline"}, t);
  if (isDigit) di++; });
for (let b=0;b<12;b++) tl.set("#pcur",{opacity:b%2?0:1},T.keys+b*0.1);
tl.set("#pcur",{opacity:0},T.keys+1.12);
tl.set("#pbox",{opacity:1},T.keys+1.12); tl.set("#pbox",{opacity:0},T.keys+1.30); tl.set("#pbox",{opacity:1},T.keys+1.44);
tl.fromTo("#pnum",{scale:1},{scale:1.08,duration:.12,yoyo:true,repeat:1,ease:"power1.out"},T.keys+1.12);
tl.fromTo("#hg",{scale:0},{scale:1,duration:.22,ease:"back.out(3)"},37.36);
tl.fromTo("#hg svg",{rotation:0},{rotation:360,duration:1.2,ease:"power2.inOut"},37.45);
tl.fromTo("#phone",{scale:1},{scale:1.06,duration:.12,yoyo:true,repeat:1,ease:"power1.out"},T.ding);

// ---------------- CTA e encerramento ----------------
tl.fromTo("#cta",{clipPath:"inset(880px 110px 710px 100px round 40px)"},{clipPath:"inset(0px 0px 0px 0px round 0px)",duration:.15,ease:"power2.in"},K.CTA_IN-0.15);
tl.fromTo("#ctaseal",{y:-20,opacity:0},{y:0,opacity:1,duration:.22,ease:"back.out(2)"},K.CTA_IN+0.2);
tl.fromTo("#ctat",{scale:.8,opacity:0},{scale:1,opacity:1,duration:.3,ease:"back.out(1.8)"},K.CTA_IN+0.28);
tl.fromTo("#ctasub",{y:20,opacity:0},{y:0,opacity:1,duration:.25,ease:"power2.out"},K.CTA_IN+0.45);
tl.fromTo("#ctaph",{y:24,opacity:0},{y:0,opacity:1,duration:.28,ease:"back.out(2)"},K.CTA_IN+0.6);
tl.fromTo("#cv1",{y:140},{y:0,duration:.7,ease:"power2.out"},K.CTA_IN+0.1);
tl.fromTo("#cv2",{x:220,opacity:0},{x:0,opacity:.7,duration:.6,ease:"power2.out"},K.CTA_IN+0.1);
tl.fromTo("#ctafade",{opacity:0},{opacity:1,duration:.25,ease:"power1.in"},K.OUTRO_IN-0.25);
tl.fromTo("#outro-w",{opacity:0},{opacity:1,duration:.25,ease:"power1.out"},K.OUTRO_IN);

// ---------------- LEGENDAS POP ----------------
K.CAP.forEach(c=>{
  tl.fromTo("#capl"+c.g,{scale:.8,opacity:0},{scale:1.05,opacity:1,duration:.08,ease:"power2.out"},c.start);
  tl.to("#capl"+c.g,{scale:1,duration:.07,ease:"power1.out"},c.start+0.08);
  c.words.forEach((t,i)=>{ if (c.kw[i]) return; const s="#c"+c.g+"w"+i;
    tl.set(s,{color:"#FFCE23"},t-0.03);
    const nt = i+1<c.words.length ? c.words[i+1] : c.end;
    tl.set(s,{color:"#FFFFFF"},nt-0.03); });
});
return tl;
}
Promise.all([400,700,800,900].map(w=>document.fonts.load(w+" 60px Montserrat")).concat([document.fonts.load("92px 'Bebas Neue'")])).then(()=>document.fonts.ready).then(()=>{
  window.__timelines["reel"] = build();
});
</script>
</body></html>
"""


def build_cover():
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Capa: Auxiliar de Serviços Gerais</title>
<meta name="viewport" content="width=1080, height=1920">
<script src="assets/gsap.min.js"></script>
<style>
{FONTS}
{BASE_CSS}
#photo{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
#mapblur{{position:absolute;left:0;right:0;top:0;height:1000px;background-image:url('cover-photo.png');background-size:1080px 1920px;background-position:0 0;filter:blur(7px) brightness(.55);-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 30%,transparent 46%);mask-image:linear-gradient(180deg,#000 0%,#000 30%,transparent 46%)}}
#face{{position:absolute;inset:0;background-image:url('cover-photo.png');background-size:1080px 1920px;-webkit-mask-image:radial-gradient(ellipse 230px 300px at 50% 32%,#000 60%,transparent 100%);mask-image:radial-gradient(ellipse 230px 300px at 50% 32%,#000 60%,transparent 100%)}}
#grad{{position:absolute;inset:0;background:linear-gradient(0deg,#00494F 0%,rgba(0,73,79,.95) 26%,rgba(0,73,79,.7) 40%,rgba(0,73,79,0) 52%)}}
#block{{position:absolute;left:90px;right:120px;top:1060px;height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center}}
#seal{{background:var(--yellow);color:var(--teal-deep);font-weight:800;font-size:48px;letter-spacing:.06em;padding:8px 26px;border-radius:12px;transform:rotate(-5deg);box-shadow:0 10px 26px rgba(0,0,0,.3)}}
#title{{color:#fff;font-size:150px;line-height:.9;text-shadow:0 6px 24px rgba(0,0,0,.35)}}
#sub{{color:#fff;font-weight:400;font-size:50px}}
#logo{{position:absolute;right:110px;bottom:388px;width:128px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}}
</style></head><body>
<div id="root" data-composition-id="cover" data-start="0" data-duration="1" data-width="1080" data-height="1920">
<img id="photo" class="clip" src="cover-photo.png" alt="" data-start="0" data-duration="1" data-track-index="0">
<div id="mapblur" class="clip" data-start="0" data-duration="1" data-track-index="1"></div>
<div id="face" class="clip" data-start="0" data-duration="1" data-track-index="2"></div>
<div id="grad" class="clip" data-start="0" data-duration="1" data-track-index="3"></div>
<div id="block-c" class="clip" data-start="0" data-duration="1" data-track-index="4"><div id="block">
<div id="seal">VAGA ABERTA</div>
<div id="title" class="bebas"><div>AUXILIAR DE</div><div>SERVIÇOS GERAIS</div></div>
<div id="sub">Envie seu currículo</div>
</div></div>
<img id="logo" class="clip" src="assets/logo-inovar.png" alt="Inovar Recursos Humanos" data-start="0" data-duration="1" data-track-index="5">
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
