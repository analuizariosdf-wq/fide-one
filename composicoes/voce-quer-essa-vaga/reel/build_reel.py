"""Gera index.html (Reel) e cover/index.html (capa) do Reel 01 da Inovar.

Todos os tempos vêm de assets/transcript.json (fala no corte aprovado) e de
../work/sfx-cues.json (efeitos da etapa 2). Rode: python3 -I build_reel.py
"""
import json, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
SPEECH_END = 48.82          # fim do vídeo da pessoa
OUTRO = 5.0                 # take "ENCERRAMENTO DE VIDEO" enviado pela cliente
TOTAL = SPEECH_END + OUTRO  # mix.wav tem esta duração
END_IN = SPEECH_END

# ---------- legendas: (palavras com tempo, índices de palavras-chave) ----------
# Cada item: lista de (texto, início). Palavra entre ** vira caixa amarela.
CAPTIONS = [
    [("Talvez", 3.85), ("você", 4.35)],
    [("não", 4.63), ("esteja", 4.85), ("procurando", 5.23)],
    [("um", 5.63), ("emprego", 5.75), ("melhor.", 5.95)],
    [("Talvez", 6.55), ("só", 6.71), ("esteja", 6.83)],
    [("tentando", 7.15), ("**fugir", 7.49), ("do", 7.81), ("atual.", 7.97)],
    [("Quando", 8.88), ("o", 9.40), ("trabalho", 9.62)],
    [("atual", 9.90), ("está", 10.16), ("ruim,", 10.42)],
    [("qualquer", 11.12), ("vaga", 11.32)],
    [("começa", 11.72), ("a", 12.00), ("parecer", 12.10), ("boa.", 12.38)],
    [("E", 13.18), ("aí", 13.26), ("mora", 13.42)],
    [("o", 13.72), ("**perigo.", 13.82)],
    [("Você", 14.42), ("vê", 14.64), ("um", 14.74)],
    [("salário", 14.94), ("parecido…", 15.18)],
    [("uma", 16.06), ("empresa", 16.12), ("diferente…", 16.36)],
    [("e", 17.22), ("pensa:", 17.32)],
    [("“Qualquer", 17.88), ("coisa", 18.10), ("é", 18.36), ("melhor", 18.46)],
    [("do", 18.82), ("que", 19.00), ("aqui.”", 19.12)],
    [("Mas", 19.65), ("se", 20.25), ("você", 20.47)],
    [("não", 20.77), ("entender", 20.97)],
    [("o", 21.41), ("que", 21.55), ("realmente", 21.71)],
    [("está", 22.19), ("fazendo", 22.39), ("você", 22.71)],
    [("querer", 23.01), ("sair,", 23.23)],
    [("pode", 24.01), ("trocar", 24.11), ("de", 24.41), ("emprego", 24.65)],
    [("e", 24.95), ("encontrar", 25.21), ("exatamente", 25.53)],
    [("o", 26.17), ("**mesmo", 26.37), ("**problema.", 26.57)],
    [("Antes", 27.49), ("de", 27.73), ("aceitar", 27.91)],
    [("uma", 28.21), ("oportunidade,", 28.35)],
    [("pense:", 29.49)],
    [("O", 29.89), ("que", 30.01), ("eu", 30.13)],
    [("quero", 30.25), ("**mudar?", 30.37)],
    [("Salário,", 31.05)],
    [("horário,", 31.92)],
    [("ambiente,", 32.70)],
    [("gestão,", 33.41)],
    [("possibilidade", 33.97), ("de", 34.31), ("crescimento?", 34.43)],
    [("Você", 35.23), ("não", 35.74), ("precisa", 36.09)],
    [("encontrar", 36.33), ("o", 36.78), ("emprego", 36.97)],
    [("**perfeito.", 37.20)],
    [("Mas", 37.95), ("precisa", 38.23), ("saber", 38.47)],
    [("o", 38.88), ("que", 39.10)],
    [("**não", 39.24), ("**quer", 39.45), ("**repetir.", 39.63)],
    [("Antes", 40.69), ("de", 40.85), ("aceitar", 41.03)],
    [("a", 41.35), ("sua", 41.49), ("próxima", 41.59), ("oportunidade,", 41.85)],
    [("escolha", 42.83), ("**três", 43.11), ("coisas", 43.51)],
    [("que", 43.85), ("precisam", 44.09), ("ser", 44.41)],
    [("diferentes", 44.67), ("do", 45.09), ("seu", 45.31)],
    [("emprego", 45.41), ("atual.", 45.71)],
    [("Isso", 46.29), ("já", 46.49), ("pode", 46.71)],
    [("mudar", 46.87), ("completamente", 47.23)],
    [("sua", 47.97), ("decisão.", 48.15)],
]
CAP_HOLD = 0.55   # quanto a última legenda de uma frase fica depois da última palavra, se houver pausa

sfx = {(c["sfx"], i): c["t"] for i, c in enumerate(json.load(open(os.path.join(HERE, "../work/sfx-cues.json"))))}
POPS = sorted(t for (k, _), t in sfx.items() if k == "pop")
TUM = next(t for (k, _), t in sfx.items() if k == "tum")
DING = next(t for (k, _), t in sfx.items() if k == "ding")

# ---------- ícones (SVG em linha, traço branco) ----------
def svg(path, vb="0 0 24 24", sw=2.2):
    return (f'<svg viewBox="{vb}" fill="none" stroke="#fff" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{path}</svg>')

ICON = {
    "money": '<span class="ic-text">R$</span>',
    "building": svg('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M11 21v-3h2v3"/>'),
    "alert": svg('<path d="M12 3.5 2.8 19.5h18.4L12 3.5Z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17" r=".6" fill="#fff"/>', sw=2.4),
    "repeat": svg('<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/>', sw=2.4),
    "clock": svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    "people": svg('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M15.5 14.2c2.6-.3 4.6 1.3 5 4.3"/>'),
    "manager": svg('<circle cx="12" cy="7.5" r="3.2"/><path d="M5.5 20c.7-3.8 3.3-6 6.5-6s5.8 2.2 6.5 6"/><path d="M12 14l-1 2.5 1 1.5 1-1.5-1-2.5"/>'),
    "growth": svg('<path d="M3.5 17.5 9.5 11.5l4 4 7-7.5"/><path d="M15.5 8h5v5"/>'),
    "check": svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', sw=3),
    "down": svg('<path d="M12 4v15"/><path d="m5.5 13 6.5 6.5 6.5-6.5"/>', sw=2.8),
}

LIST = [("Salário", "money"), ("Horário", "clock"), ("Ambiente", "people"), ("Gestão", "manager"), ("Crescimento", "growth")]

FONTS = "".join(
    f"@font-face{{font-family:'Montserrat';font-weight:{w};font-style:normal;src:url('{{root}}assets/fonts/montserrat-latin-{w}-normal.woff2') format('woff2')}}"
    for w in (400, 700, 800, 900))

BASE_CSS = """
:root{--ink:#212829;--teal-deep:#00494F;--teal:#00696E;--mist:#D7E3E2;--paper:#F1F1F1;--yellow:#FFCE23}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:'Montserrat',sans-serif}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#000}
.hl{position:relative;display:inline-block;color:var(--teal-deep);z-index:0}
.hl .paint{position:absolute;left:-.14em;right:-.14em;top:.02em;bottom:-.02em;background:var(--yellow);border-radius:.14em;z-index:-1;transform-origin:0 50%}
"""


def esc(s):
    return html.escape(s, quote=False)


def caption_html():
    out, js = [], []
    for gi, grp in enumerate(CAPTIONS):
        start = grp[0][1] - 0.04
        nxt = CAPTIONS[gi + 1][0][1] - 0.04 if gi + 1 < len(CAPTIONS) else SPEECH_END
        end = min(nxt, grp[-1][1] + 0.45 + CAP_HOLD) if nxt - grp[-1][1] > 1.2 else nxt
        if gi + 1 == len(CAPTIONS):
            end = END_IN
        words, inbox = [], False
        spans = []
        for wi, (w, t) in enumerate(grp):
            kw = w.startswith("**")
            w = w.lstrip("*")
            spans.append((w, t, kw))
        # agrupa palavras-chave vizinhas numa só caixa
        html_words, k = [], 0
        while k < len(spans):
            w, t, kw = spans[k]
            if kw:
                run = []
                while k < len(spans) and spans[k][2]:
                    run.append(spans[k]); k += 1
                inner = " ".join(f'<span class="w kw" id="cw{gi}_{spans.index(r)}">{esc(r[0])}</span>' for r in run)
                html_words.append(f'<span class="capbox">{inner}</span>')
            else:
                html_words.append(f'<span class="w" id="cw{gi}_{k}">{esc(w)}</span>')
                k += 1
        out.append(f'<div id="cap{gi}" class="clip cap" data-start="{start:.3f}" data-duration="{end - start:.3f}" '
                   f'data-track-index="20"><div class="capline" id="capl{gi}">{" ".join(html_words)}</div></div>')
        js.append(f'tl.fromTo("#capl{gi}",{{opacity:0,y:18,scale:.92}},{{opacity:1,y:0,scale:1,duration:.14,ease:"back.out(2)"}},{start:.3f});')
        for k, (w, t, kw) in enumerate(spans):
            sel = f"#cw{gi}_{k}"
            if kw:
                js.append(f'tl.fromTo("{sel}",{{scale:1}},{{scale:1.08,duration:.08,yoyo:true,repeat:1,ease:"power1.out"}},{t - 0.02:.3f});')
            else:
                js.append(f'tl.set("{sel}",{{color:"#FFCE23"}},{t - 0.02:.3f});')
                nt = spans[k + 1][1] if k + 1 < len(spans) else end
                js.append(f'tl.set("{sel}",{{color:"#FFFFFF"}},{nt - 0.02:.3f});')
    return "\n".join(out), "\n".join(js)


def hook_title(prefix, painted_at=None):
    """Título do gancho / capa. Palavras comuns em 400, vaga e SAIR em 800, SAIR na caixa amarela."""
    words = [("Você", 400), ("quer", 400), ("essa", 400), ("vaga", 800), ("ou", 400), ("só", 400), ("quer", 400),
             ("SAIR", 800), ("do", 400), ("seu", 400), ("emprego?", 400)]
    parts = []
    for i, (w, wt) in enumerate(words):
        if w == "SAIR":
            parts.append(f'<span class="tw" id="{prefix}w{i}" style="font-weight:800"><span class="hl" id="{prefix}sair">'
                         f'<span class="paint" id="{prefix}paint"></span>SAIR</span></span>')
        else:
            parts.append(f'<span class="tw" id="{prefix}w{i}" style="font-weight:{wt}">{w}</span>')
    return " ".join(parts), len(words)


def build_main():
    caps, capjs = caption_html()
    title, nwords = hook_title("h")
    list_rows = "".join(
        f'<div class="row" id="row{i}"><span class="ic">{ICON[ic]}</span><span class="lbl">{esc(lbl)}</span>'
        f'<span class="ok" id="ok{i}">{ICON["check"]}</span></div>' for i, (lbl, ic) in enumerate(LIST))
    pops_js = "\n".join(
        f'tl.fromTo("#row{i}",{{opacity:0,x:-40,scale:.9}},{{opacity:1,x:0,scale:1,duration:.22,ease:"back.out(2.2)"}},{t - 0.05:.3f});'
        f'tl.fromTo("#ok{i}",{{scale:0,rotation:-30}},{{scale:1,rotation:0,duration:.2,ease:"back.out(3)"}},{t + 0.12:.3f});'
        for i, t in enumerate(POPS))
    shake = "".join(
        f'tl.to("#shake",{{x:{dx},y:{dy},duration:.04,ease:"none"}},{TUM + 0.02 + k * 0.04:.3f});'
        for k, (dx, dy) in enumerate([(9, -6), (-8, 5), (7, 7), (-6, -5), (5, 3), (-3, -2), (2, 1), (0, 0)]))
    hook_in = "\n".join(
        (f'tl.fromTo("#hw{i}",{{opacity:1,scale:1.25}},{{opacity:1,scale:1,duration:.2,ease:"back.out(2)"}},0);' if i == 0 else
         f'tl.fromTo("#hw{i}",{{opacity:0,y:40,scale:.85}},{{opacity:1,y:0,scale:1,duration:.18,ease:"back.out(2)"}},{0.04 + i * 0.07:.3f});')
        for i in range(nwords))
    font_css = FONTS.replace("{root}", "")
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Você quer essa vaga ou só quer sair do seu emprego?</title>
<meta name="viewport" content="width=1080, height=1920">
<script src="assets/gsap.min.js"></script>
<style>
{font_css}
{BASE_CSS}
#cam{{position:absolute;inset:0;transform-origin:50% 30%}}
#shake{{position:absolute;inset:0}}
#speaker{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
/* gancho */
#hook{{position:absolute;left:0;right:0;top:870px;height:470px;display:flex;align-items:center;justify-content:center}}
#hookbox{{width:860px;text-align:center;color:#fff;font-size:94px;line-height:1.13;letter-spacing:-1px;text-shadow:0 4px 22px rgba(0,0,0,.55),0 2px 6px rgba(0,0,0,.5)}}
.tw{{display:inline-block}}
#hook .hl{{text-shadow:none}}
/* legendas */
.cap{{position:absolute;left:120px;right:120px;top:1290px;height:230px;display:flex;align-items:center;justify-content:center}}
.capline{{text-align:center;color:#fff;font-weight:800;font-size:66px;line-height:1.18;letter-spacing:-.5px;text-shadow:0 3px 16px rgba(0,0,0,.65),0 2px 4px rgba(0,0,0,.7)}}
.w{{display:inline-block}}
.capbox{{display:inline-block;background:var(--yellow);color:var(--teal-deep);padding:0 .2em;border-radius:.16em;text-shadow:none;box-shadow:0 6px 18px rgba(0,0,0,.25)}}
/* elementos */
.card{{position:absolute;display:flex;align-items:center;gap:26px;background:var(--teal-deep);border-radius:30px;padding:22px 34px 22px 22px;box-shadow:0 14px 40px rgba(0,0,0,.35);color:#fff;font-weight:800;font-size:50px;letter-spacing:-.5px}}
.ic{{width:96px;height:96px;flex:0 0 96px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center}}
.ic svg{{width:56px;height:56px}}
.ic-text{{color:#fff;font-weight:900;font-size:38px;letter-spacing:-1px}}
#card1{{left:90px;top:860px}}
#card2{{right:150px;top:1060px}}
#alert{{position:absolute;left:770px;top:420px;width:170px;height:170px;border-radius:50%;background:var(--teal);border:7px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.35)}}
#alert svg{{width:96px;height:96px}}
#bubble{{position:absolute;left:600px;top:280px;width:390px}}
#bubble .b{{background:#fff;border-radius:46px;padding:30px 30px;color:var(--teal-deep);font-weight:800;font-size:40px;line-height:1.16;text-align:center;box-shadow:0 12px 34px rgba(0,0,0,.3)}}
#bubble .d1,#bubble .d2{{position:absolute;background:#fff;border-radius:50%;box-shadow:0 6px 16px rgba(0,0,0,.25)}}
#bubble .d1{{width:44px;height:44px;left:40px;bottom:-50px}}
#bubble .d2{{width:24px;height:24px;left:6px;bottom:-86px}}
#repeat{{position:absolute;left:110px;top:640px;width:190px;height:190px;border-radius:50%;background:var(--teal-deep);border:6px solid var(--teal);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.35)}}
#repeat svg{{width:118px;height:118px}}
#mudar{{position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center}}
#mudar span{{background:var(--teal-deep);color:#fff;font-weight:800;font-size:60px;padding:18px 40px;border-radius:999px;box-shadow:0 12px 34px rgba(0,0,0,.35);letter-spacing:-.5px}}
#list{{position:absolute;left:150px;right:150px;top:780px;background:rgba(0,73,79,.94);border-radius:34px;padding:22px 30px;box-shadow:0 16px 44px rgba(0,0,0,.38)}}
.row{{display:flex;align-items:center;gap:24px;height:86px}}
.row .ic{{width:72px;height:72px;flex:0 0 72px}}
.row .ic svg{{width:42px;height:42px}}
.row .ic-text{{font-size:28px}}
.row .lbl{{flex:1;color:#fff;font-weight:800;font-size:46px;letter-spacing:-.5px}}
.row .ok{{width:56px;height:56px;border-radius:50%;background:var(--teal);border:3px solid #fff;display:flex;align-items:center;justify-content:center}}
.row .ok svg{{width:34px;height:34px}}
#three{{position:absolute;left:0;right:0;top:690px;display:flex;flex-direction:column;align-items:center;gap:30px}}
#three .n{{width:300px;height:300px;border-radius:50%;background:var(--teal-deep);border:10px solid var(--teal);display:flex;align-items:center;justify-content:center;color:var(--yellow);font-weight:900;font-size:230px;line-height:1;box-shadow:0 16px 44px rgba(0,0,0,.4)}}
#three .n span{{display:block;transform:translateY(-6px)}}
#three .boxes{{display:flex;gap:34px}}
#three .bx{{width:92px;height:92px;border-radius:20px;border:7px solid #fff;background:rgba(0,73,79,.85);box-shadow:0 8px 22px rgba(0,0,0,.35)}}
</style></head><body>
<div id="root" data-composition-id="reel" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
<div id="cam"><div id="shake">
<video id="speaker" class="clip" src="assets/speaker.mp4" muted playsinline data-start="0" data-duration="{SPEECH_END}" data-track-index="0"></video>
</div></div>
<audio id="mix" src="assets/mix.wav" data-start="0" data-duration="{TOTAL}" data-track-index="1"></audio>

<div id="hook" class="clip" data-start="0" data-duration="3.9" data-track-index="10"><div id="hookbox">{title}</div></div>

<div id="alert-c" class="clip" data-start="{TUM - 0.08:.3f}" data-duration="{14.95 - TUM + 0.08:.3f}" data-track-index="11"><div id="alert">{ICON["alert"]}</div></div>
<div id="card1-c" class="clip" data-start="14.86" data-duration="2.42" data-track-index="12"><div class="card" id="card1"><span class="ic">{ICON["money"]}</span>Salário parecido</div></div>
<div id="card2-c" class="clip" data-start="16.04" data-duration="1.24" data-track-index="13"><div class="card" id="card2"><span class="ic">{ICON["building"]}</span>Empresa diferente</div></div>
<div id="bubble-c" class="clip" data-start="17.80" data-duration="1.85" data-track-index="11"><div id="bubble"><div class="b">“Qualquer coisa é melhor do que aqui”</div><span class="d1"></span><span class="d2"></span></div></div>
<div id="repeat-c" class="clip" data-start="26.10" data-duration="1.80" data-track-index="11"><div id="repeat">{ICON["repeat"]}</div></div>
<div id="mudar-c" class="clip" data-start="29.85" data-duration="5.30" data-track-index="12"><div id="mudar"><span>O que eu quero mudar?</span></div></div>
<div id="list-c" class="clip" data-start="30.80" data-duration="4.35" data-track-index="13"><div id="list">{list_rows}</div></div>
<div id="three-c" class="clip" data-start="{DING - 0.12:.3f}" data-duration="{46.25 - DING + 0.12:.3f}" data-track-index="11"><div id="three"><div class="n"><span>3</span></div><div class="boxes"><div class="bx" id="bx0"></div><div class="bx" id="bx1"></div><div class="bx" id="bx2"></div></div></div></div>

{caps}

<video id="outro" class="clip" src="assets/encerramento.mp4" muted playsinline data-start="{END_IN}" data-duration="{OUTRO}" data-track-index="30"></video>
</div>
<script>
const tl = gsap.timeline({{paused:true}});
tl.set({{}},{{}},{TOTAL});
// ---- gancho: whoosh em 0,05 s; palavras entram rápido; a caixa pinta o SAIR quando ela fala
tl.fromTo("#cam",{{scale:1}},{{scale:1.04,duration:3.8,ease:"none"}},0);
{hook_in}
tl.set("#hsair",{{color:"#FFFFFF"}},0);
tl.fromTo("#hpaint",{{scaleX:0}},{{scaleX:1,duration:.22,ease:"power2.out"}},2.36);
tl.to("#hsair",{{color:"#00494F",duration:.08}},2.42);
tl.to("#hookbox",{{scale:.55,y:-120,opacity:0,duration:.32,ease:"power2.in"}},3.52);
tl.set("#cam",{{scale:1}},3.84);
// ---- cena 1: punch-in em "fugir do atual"
tl.to("#cam",{{scale:1.15,duration:.28,ease:"power2.out"}},7.40);
tl.set("#cam",{{scale:1}},8.47);
// ---- cena 2: perigo
tl.to("#cam",{{scale:1.12,duration:.12,ease:"power3.out"}},{TUM - 0.06:.3f});
{shake}
tl.to("#cam",{{scale:1,duration:.35,ease:"power2.inOut"}},14.38);
tl.fromTo("#alert",{{scale:0,rotation:-25}},{{scale:1,rotation:0,duration:.26,ease:"back.out(2.6)"}},{TUM - 0.08:.3f});
tl.to("#alert",{{rotation:8,duration:.12,yoyo:true,repeat:3,ease:"sine.inOut"}},{TUM + 0.2:.3f});
tl.to("#alert",{{scale:0,opacity:0,duration:.18,ease:"power2.in"}},14.75);
tl.fromTo("#card1",{{x:-760}},{{x:0,duration:.34,ease:"back.out(1.3)"}},14.86);
tl.fromTo("#card2",{{x:760}},{{x:0,duration:.34,ease:"back.out(1.3)"}},16.04);
tl.to("#card1",{{x:-760,duration:.24,ease:"power2.in"}},17.02);
tl.to("#card2",{{x:760,duration:.24,ease:"power2.in"}},17.04);
tl.fromTo("#bubble",{{scale:.4,opacity:0,transformOrigin:"10% 100%"}},{{scale:1,opacity:1,duration:.3,ease:"back.out(2)"}},17.80);
tl.fromTo("#bubble",{{rotation:-2}},{{rotation:2,duration:.45,yoyo:true,repeat:2,ease:"sine.inOut"}},18.1);
tl.to("#bubble",{{scale:.6,opacity:0,duration:.18,ease:"power2.in"}},19.47);
// ---- cena 3
tl.fromTo("#repeat",{{scale:0}},{{scale:1,duration:.25,ease:"back.out(2.4)"}},26.10);
tl.fromTo("#repeat svg",{{rotation:0}},{{rotation:540,duration:1.6,ease:"power1.inOut"}},26.15);
tl.to("#repeat",{{scale:0,duration:.18,ease:"power2.in"}},27.72);
tl.fromTo("#mudar span",{{y:-60,opacity:0,scale:.9}},{{y:0,opacity:1,scale:1,duration:.3,ease:"back.out(2)"}},29.85);
tl.fromTo("#list",{{opacity:0,y:40,scale:.96}},{{opacity:1,y:0,scale:1,duration:.25,ease:"power2.out"}},30.80);
{pops_js}
tl.to(["#list","#mudar span"],{{opacity:0,y:-30,duration:.22,ease:"power2.in"}},34.92);
// ---- cena 4
tl.to("#cam",{{scale:1.15,duration:.28,ease:"power2.out"}},39.10);
tl.set("#cam",{{scale:1}},40.55);
tl.fromTo("#three .n",{{scale:0,rotation:-20}},{{scale:1,rotation:0,duration:.3,ease:"back.out(2.4)"}},{DING - 0.12:.3f});
tl.fromTo("#three .bx",{{y:30,opacity:0}},{{y:0,opacity:1,duration:.2,stagger:.12,ease:"back.out(2)"}},{DING + 0.32:.3f});
tl.to("#three",{{opacity:0,y:30,duration:.22,ease:"power2.in"}},46.03);
// ---- legendas
{capjs}
window.__timelines["reel"] = tl;
</script>
</body></html>
"""


def build_cover():
    title, _ = hook_title("c")
    font_css = FONTS.replace("{root}", "")
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Capa do Reel</title>
<meta name="viewport" content="width=1080, height=1920">
<script src="assets/gsap.min.js"></script>
<style>
{font_css}
{BASE_CSS}
#photo{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.78)}}
#grad{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,73,79,0) 30%,rgba(0,73,79,.55) 52%,rgba(0,73,79,.92) 78%,#00494F 100%)}}
#title{{position:absolute;left:0;right:0;top:880px;height:470px;display:flex;align-items:center;justify-content:center}}
#tbox{{width:880px;text-align:center;color:#fff;font-size:100px;line-height:1.12;letter-spacing:-1px;text-shadow:0 4px 22px rgba(0,0,0,.4)}}
#tbox .hl{{text-shadow:none}}
.tw{{display:inline-block}}
#clogo{{position:absolute;right:90px;top:310px;width:170px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.45))}}
#clogo img{{display:block;width:100%}}
</style></head><body>
<div id="root" data-composition-id="cover" data-start="0" data-duration="1" data-width="1080" data-height="1920">
<img id="photo" class="clip" src="cover-photo.png" alt="" data-start="0" data-duration="1" data-track-index="0">
<div id="grad" class="clip" data-start="0" data-duration="1" data-track-index="1"></div>
<div id="title" class="clip" data-start="0" data-duration="1" data-track-index="2"><div id="tbox">{title}</div></div>
<div id="clogo-c" class="clip" data-start="0" data-duration="1" data-track-index="3"><div id="clogo"><img src="assets/logo-inovar.png" alt="Inovar Recursos Humanos"></div></div>
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
