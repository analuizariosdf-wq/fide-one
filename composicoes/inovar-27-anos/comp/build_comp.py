"""Gera index.html do vídeo institucional "Inovar 27 anos" (TV, 1920x1080, 30 fps).

Lê ../work/timeline.json (vozes e seções), ../work/shots.json (takes já no formato 16:9)
e ../work/audio/voz-n*.json (palavras da narração tratada) para sincronizar os números.
Rode: python3 -I build_comp.py
"""
import json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(HERE, "../work")
T = json.load(open(f"{W}/timeline.json"))
S = json.load(open(f"{W}/shots.json"))
VO = T["voices"]
END = T["end"]
SEC = T["sections"]


def word(n, text, k=0):
    """Momento absoluto da k-ésima palavra que começa com `text` no bloco de narração n."""
    ws = [w for w in json.load(open(f"{W}/audio/voz-{n}.json"))["words"] if w["type"] == "word"]
    hits = [w for w in ws if w["text"].strip(",.").startswith(text)]
    return round(VO[n]["start"] + hits[k]["start"], 3)


# ---------- sequência de imagens ----------
clips = []   # (id, src, start, dur, kind)
order = ["abertura", "sede", "bastidores", "contratacoes", "kelly", "geovanna", "equipe", "respostas", "final", "encerramento"]
CARDS = {}   # id → (tipo, conteúdo, início, fim visível)
for sec in order:
    if sec in S:
        for j, s in enumerate(S[sec]):
            if "card" in s:
                nxt = S[sec][j + 1]["start"] if j + 1 < len(S[sec]) else s["start"] + s["dur"] - 0.5
                CARDS[s["name"]] = (s["card"], s["content"], s["start"], nxt)
                clips.append((s["name"], None, s["start"], s["dur"], "card"))
            else:
                kind = "raw" if sec in ("abertura", "encerramento") else "broll"
                clips.append((s["name"], f"assets/shots/{s['name']}.mp4", s["start"], s["dur"], kind))
    else:
        a, b = SEC[sec]
        clips.append((sec, f"assets/shots/{sec}.mp4", a, b - a + (0.0 if sec == "respostas" else 0.5), "talk"))
os.makedirs(f"{HERE}/assets/shots", exist_ok=True)
for c in clips:
    if c[1] is None:
        continue
    dst = f"{HERE}/{c[1]}"
    if os.path.exists(dst):
        os.remove(dst)
    shutil.copyfile(f"{W}/shots/{os.path.basename(c[1])}", dst)

# ---------- momentos dos gráficos ----------
CLOSE_IN = SEC["encerramento"][0]
N = dict(a27=VO["n6"]["start"] + 0.05)
LBL = {"s1999": ("o começo", 1999, "", "", False), "s350": ("entrevistas", 350, "+", " mil", False),
       "s19698": ("contratações", 19698, "", "", True), "s300": ("profissionais ativos", 300, "+", "", False),
       "s71": ("empresas clientes", 71, "", "", False)}
STATS = []  # id, número final, prefixo, sufixo, rótulo, entra, sai, separador de milhar
for cid, (kind, content, c0, c1) in CARDS.items():
    if kind == "stat":
        lab, val, pre, suf, dot = LBL[content]
        STATS.append((content, val, pre, suf, lab, c0 + 0.2, c1 - 0.3, dot))
LOWER = [("lt-kelly", "Kelly", "Gestora de Recursos Humanos", SEC["kelly"][0] + 0.9, VO["kelly2"]["start"] + 1.6),
         ("lt-geo", "Geovanna", "Recrutadora", SEC["geovanna"][0] + 0.8, VO["geo2"]["start"] + 2.6)]
ASK_IN, ASK_OUT = SEC["pergunta"][0], SEC["respostas"][0] + 0.25
CARD_IN = CLOSE_IN


def stat_html(sid, label):
    return (f'<div id="{sid}" class="stat oncard"><div class="bar"></div>'
            f'<div class="mask"><div class="num" id="{sid}-n">0</div></div>'
            f'<div class="mask"><div class="lbl">{label}</div></div><div class="uline"></div></div>')


CURVES = ('<svg class="curves" viewBox="0 0 1920 1080" preserveAspectRatio="none">'
          '<path class="cv1" d="M-80 960 C 520 760, 1240 760, 2000 420" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="120" stroke-linecap="round"/>'
          '<path class="cv2" d="M-80 1100 C 600 880, 1320 860, 2000 600" fill="none" stroke="rgba(2,77,82,.6)" stroke-width="96" stroke-linecap="round"/>'
          '<path class="cv3" d="M-80 150 C 600 30, 1300 110, 2000 -50" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="70" stroke-linecap="round"/></svg>')


def clip_html(i, c):
    if c[4] == "card":
        kind, content = CARDS[c[0]][:2]
        lines = "".join(f'<div class="mask"><div class="cline">{x}</div></div>' for x in content.split("|"))
        inner = (f'<div class="ctext">{lines}</div>' if kind == "text" else "")
        return (f'<div class="shot card" id="w-{c[0]}" style="z-index:{10 + i}"><div class="kb" id="k-{c[0]}">'
                f'{CURVES}{inner}</div></div>')
    return (f'<div class="shot {c[4]}" id="w-{c[0]}" style="z-index:{10 + i}"><div class="kb" id="k-{c[0]}">'
            f'<video id="{c[0]}" class="clip" src="{c[1]}" muted playsinline data-start="{c[2]:.3f}" '
            f'data-duration="{c[3]:.3f}" data-track-index="{i % 2}"></video></div></div>')


vids = "\n".join(clip_html(i, c) for i, c in enumerate(clips))
TEXTS = [[cid, round(v[2], 3), round(v[3], 3)] for cid, v in CARDS.items() if v[0] == "text"]

stats_left = "".join(stat_html(s[0], s[4]) for s in STATS)
stats_team = ""

HTML = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=1920, height=1080">
<title>Inovar 27 anos</title>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:Poppins;font-weight:500;src:url(assets/fonts/poppins-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:Poppins;font-weight:600;src:url(assets/fonts/poppins-latin-600-normal.woff2) format("woff2")}
@font-face{font-family:Poppins;font-weight:700;src:url(assets/fonts/poppins-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:Poppins;font-weight:800;src:url(assets/fonts/poppins-latin-800-normal.woff2) format("woff2")}
:root{--pet:#036B6E;--pet2:#024D52;--white:#FFFFFF}
html,body{margin:0;background:#000;width:1920px;height:1080px;overflow:hidden}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#000;font-family:Poppins,sans-serif;color:#fff}
.shot{position:absolute;inset:0;overflow:hidden;visibility:hidden}
.kb{position:absolute;inset:0;transform-origin:50% 50%}
.kb video{width:100%;height:100%;object-fit:cover;display:block}
/* sombra para leitura dos números (lado esquerdo) */
#shade{position:absolute;inset:0;z-index:200;opacity:0;
  background:linear-gradient(90deg,rgba(2,30,32,.82) 0%,rgba(2,40,43,.55) 38%,rgba(0,0,0,0) 66%)}
#shadeB{position:absolute;inset:0;z-index:200;opacity:0;
  background:linear-gradient(0deg,rgba(2,30,32,.78) 0%,rgba(2,40,43,.35) 34%,rgba(0,0,0,0) 55%)}
.stat{position:absolute;left:150px;z-index:220;display:none}
.stat .bar{position:absolute;left:-44px;top:18px;bottom:22px;width:14px;background:var(--pet);border-radius:7px;transform-origin:50% 100%;
  box-shadow:0 0 0 2px rgba(255,255,255,.12)}
.stat .mask{overflow:hidden;padding-bottom:4px}
.stat .num{font-weight:800;line-height:1.02;letter-spacing:-2px;text-shadow:0 4px 30px rgba(0,0,0,.45);font-variant-numeric:tabular-nums}
.stat .lbl{font-weight:600;line-height:1.15;text-shadow:0 3px 18px rgba(0,0,0,.5)}
.stat .uline{height:10px;width:260px;background:var(--pet);border-radius:5px;margin-top:18px;transform-origin:0 50%}
.stat.big{bottom:150px}
.stat.big .num{font-size:220px}
.stat.big .lbl{font-size:76px}
.stat.mid .num{font-size:150px}
.stat.mid .lbl{font-size:64px}
.stat.oncard{left:0;right:0;top:50%;transform:translateY(-54%);text-align:center}
.stat.oncard .bar{display:none}
.stat.oncard .num{font-size:250px}
.stat.oncard .lbl{font-size:84px}
.stat.oncard .uline{margin:26px auto 0;width:300px;transform-origin:50% 50%}
.card .curves{width:112%;left:0}
.card .kb{background:radial-gradient(120% 120% at 30% 30%,#047c80 0%,var(--pet) 40%,var(--pet2) 100%)}
.card .ctext{position:absolute;left:150px;right:150px;top:50%;transform:translateY(-50%);text-align:center}
.card .mask{overflow:hidden;padding-bottom:6px}
.card .cline{font-weight:700;font-size:110px;line-height:1.18}
/* nome e cargo */
.lt{position:absolute;left:110px;bottom:96px;z-index:230;display:none}
.lt .box{background:var(--pet);padding:22px 44px 24px 40px;border-radius:14px;border-left:14px solid var(--white);transform-origin:0 50%;
  box-shadow:0 10px 40px rgba(0,0,0,.35)}
.lt .mask{overflow:hidden}
.lt .name{font-weight:700;font-size:76px;line-height:1.1}
.lt .role{font-weight:600;font-size:60px;line-height:1.15;color:#E6F3F3}
/* pergunta "27 anos de Inovar é..." */
#ask{position:absolute;inset:0;z-index:300;background:radial-gradient(120% 120% at 30% 30%,#047c80 0%,var(--pet) 38%,var(--pet2) 100%);display:none;overflow:hidden}
#ask .t{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center}
#ask .mask{overflow:hidden;display:inline-block}
#ask .line{font-weight:700;font-size:128px;line-height:1.15}
.curves{position:absolute;inset:0;width:100%;height:100%}
/* 27 ANOS */
#big27{position:absolute;left:0;right:0;top:50%;transform:translateY(-52%);z-index:320;text-align:center;display:none}
#big27 .mask{overflow:hidden}
#big27 .num{font-weight:800;font-size:360px;line-height:1;letter-spacing:-6px;text-shadow:0 8px 60px rgba(0,0,0,.5)}
#big27 .anos{font-weight:700;font-size:120px;letter-spacing:28px;line-height:1.05;margin-left:28px;text-shadow:0 6px 40px rgba(0,0,0,.5)}
#shadeC{position:absolute;inset:0;z-index:310;opacity:0;background:radial-gradient(70% 70% at 50% 50%,rgba(2,50,53,.62) 0%,rgba(2,40,43,.45) 60%,rgba(2,30,32,.6) 100%)}
/* encerramento */
#card{position:absolute;inset:0;z-index:400;background:#fff;display:none;overflow:hidden}
#logo{position:absolute;left:50%;top:80px;width:500px;margin-left:-250px}
#tag{position:absolute;left:0;right:0;top:600px;text-align:center}
#tag .mask{overflow:hidden}
#tag .l1{font-weight:600;font-size:60px;line-height:1.2;color:var(--pet2)}
#tag .l2{font-weight:700;font-size:60px;letter-spacing:10px;line-height:1.3;color:var(--pet);margin-top:24px}
#fade{position:absolute;inset:0;z-index:900;background:#000;opacity:0}
</style></head>
<body>
<div id="root" data-composition-id="inovar27" data-start="0" data-duration="%%END%%" data-width="1920" data-height="1080">
%%VIDS%%
<audio id="mix" src="assets/mix.wav" data-start="0" data-duration="%%END%%" data-track-index="2"></audio>
<div id="shade"></div><div id="shadeB"></div>
%%STATS_LEFT%%
%%STATS_TEAM%%
<div class="lt" id="lt-kelly"><div class="box"><div class="mask"><div class="name">Kelly</div></div><div class="mask"><div class="role">Gestora de Recursos Humanos</div></div></div></div>
<div class="lt" id="lt-geo"><div class="box"><div class="mask"><div class="name">Geovanna</div></div><div class="mask"><div class="role">Recrutadora</div></div></div></div>
<div id="ask">
  <svg class="curves" viewBox="0 0 1920 1080" preserveAspectRatio="none">
    <path id="ac1" d="M-50 900 C 500 640, 1200 620, 1990 300" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="120" stroke-linecap="round"/>
    <path id="ac2" d="M-50 1040 C 600 780, 1300 760, 1990 480" fill="none" stroke="rgba(2,77,82,.55)" stroke-width="90" stroke-linecap="round"/>
    <path id="ac3" d="M-50 160 C 600 40, 1300 120, 1990 -40" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="70" stroke-linecap="round"/>
  </svg>
  <div class="t"><div class="mask"><div class="line" id="ask1">27 anos de Inovar é…</div></div></div>
</div>
<div id="shadeC"></div>
<div id="big27"><div class="mask"><div class="num" id="n27">0</div></div><div class="mask"><div class="anos" id="anos27">ANOS</div></div></div>
<div id="fade"></div>
</div>
<script>
const CLIPS = %%CLIPS%%;
const STATS = %%STATS%%;
const LOWER = %%LOWER%%;
const TEXTS = %%TEXTS%%;
const ASK_IN = %%ASK_IN%%, ASK_OUT = %%ASK_OUT%%, A27 = %%A27%%, CARD_IN = %%CARD_IN%%, END = %%END%%;
const fmt = (v, dot) => { v = Math.round(v); return dot ? v.toLocaleString("pt-BR") : String(v); };
function build(){
  const tl = gsap.timeline({paused:true});
  tl.set({}, {}, END);
  // ---- imagens: visibilidade, movimento lento e transições (empurrão com desfoque / zoom)
  CLIPS.forEach((c, i) => {
    const [id, start, dur, kind] = c;
    const w = "#w-" + id, k = "#k-" + id;
    tl.set(w, {visibility:"visible"}, start);
    tl.set(w, {visibility:"hidden"}, start + dur);
    if (kind === "card") tl.fromTo(k + " .curves", {xPercent:-6}, {xPercent:0, ease:"none", duration:dur}, start);
    if (kind === "broll") tl.fromTo(k, {scale:1.0}, {scale:1.07, ease:"none", duration:dur}, start);
    if (i === 0) return;
    const prev = CLIPS[i-1];
    const pw = "#w-" + prev[0];
    const tin = start, d = 0.55;
    if (kind === "raw") { tl.fromTo(w, {opacity:0}, {opacity:1, duration:0.5, ease:"power1.inOut"}, tin); return; }
    const push = (i % 3 === 1) && kind !== "talk" && prev[3] !== "talk" && prev[3] !== "raw";
    if (push) {
      tl.fromTo(w, {xPercent:100, filter:"blur(14px)"}, {xPercent:0, filter:"blur(0px)", duration:d, ease:"power3.inOut"}, tin);
      tl.fromTo(pw, {xPercent:0, filter:"blur(0px)"}, {xPercent:-35, filter:"blur(14px)", duration:d, ease:"power3.inOut", immediateRender:false}, tin);
    } else {
      tl.fromTo(w, {opacity:0, scale:1.10}, {opacity:1, scale:1, duration:d + 0.15, ease:"power2.out"}, tin);
    }
  });
  // ---- abertura e final
  TEXTS.forEach(t => {
    const [id, tin, tout] = t, el = "#w-" + id + " .cline";
    tl.fromTo(el, {yPercent:110}, {yPercent:0, duration:0.8, ease:"power3.out", stagger:0.14}, tin + 0.35);
    tl.to(el, {yPercent:-110, duration:0.5, ease:"power2.in"}, tout - 0.55);
  });
  // ---- números
  STATS.forEach(s => {
    const [id, val, pre, suf, tin, tout, dot, side] = s;
    const el = "#" + id;
    tl.set(el, {display:"block"}, tin);
    tl.set(el, {display:"none"}, tout + 0.6);
    if (side === "X") tl.fromTo("#shade", {opacity:0}, {opacity:1, duration:0.6, ease:"power1.out", immediateRender:false}, tin - 0.2);
    tl.fromTo(el + " .bar", {scaleY:0}, {scaleY:1, duration:0.7, ease:"power3.out"}, tin);
    tl.fromTo(el + " .num", {yPercent:105}, {yPercent:0, duration:0.75, ease:"power3.out"}, tin + 0.05);
    const o = {v:0};
    tl.to(o, {v:val, duration:1.3, ease:"power2.out", onUpdate:()=>{ document.querySelector(el + "-n").textContent = pre + fmt(o.v, dot) + suf; }}, tin + 0.1);
    tl.set(o, {v:0}, tin);
    tl.fromTo(el + " .lbl", {yPercent:110}, {yPercent:0, duration:0.7, ease:"power3.out"}, tin + 0.45);
    tl.fromTo(el + " .uline", {scaleX:0}, {scaleX:1, duration:0.9, ease:"power3.out"}, tin + 0.55);
    tl.to([el + " .num", el + " .lbl"], {yPercent:-110, duration:0.5, ease:"power2.in"}, tout);
    tl.to([el + " .bar"], {scaleY:0, duration:0.45, ease:"power2.in"}, tout + 0.05);
    tl.to([el + " .uline"], {scaleX:0, duration:0.45, ease:"power2.in"}, tout);
    if (side === "X") tl.to("#shade", {opacity:0, duration:0.6}, tout + 0.15);
  });
  // ---- nome e cargo
  LOWER.forEach(l => {
    const [id, tin, tout] = l, el = "#" + id;
    tl.set(el, {display:"block"}, tin);
    tl.set(el, {display:"none"}, tout + 0.7);
    tl.fromTo(el + " .box", {scaleX:0}, {scaleX:1, duration:0.6, ease:"power3.out"}, tin);
    tl.fromTo(el + " .name", {yPercent:110}, {yPercent:0, duration:0.6, ease:"power3.out"}, tin + 0.3);
    tl.fromTo(el + " .role", {yPercent:110}, {yPercent:0, duration:0.6, ease:"power3.out"}, tin + 0.45);
    tl.to([el + " .name", el + " .role"], {yPercent:-110, duration:0.4, ease:"power2.in"}, tout);
    tl.to(el + " .box", {scaleX:0, duration:0.45, ease:"power2.in"}, tout + 0.25);
  });
  // ---- "27 anos de Inovar é…"
  tl.set("#ask", {display:"block"}, ASK_IN);
  tl.fromTo("#ask", {clipPath:"circle(0% at 50% 50%)"}, {clipPath:"circle(80% at 50% 50%)", duration:0.7, ease:"power3.inOut"}, ASK_IN);
  ["#ac1","#ac2","#ac3"].forEach((p, j) => tl.fromTo(p, {xPercent:-30, opacity:0}, {xPercent:0, opacity:1, duration:1.4, ease:"power2.out"}, ASK_IN + 0.1*j));
  tl.fromTo("#ask1", {yPercent:110}, {yPercent:0, duration:0.7, ease:"power3.out"}, ASK_IN + 0.35);
  tl.to("#ask", {opacity:0, scale:1.06, duration:0.45, ease:"power2.in"}, ASK_OUT - 0.45);
  tl.set("#ask", {display:"none"}, ASK_OUT);
  // ---- 27 ANOS
  tl.set("#big27", {display:"block"}, A27);
  tl.fromTo("#shadeC", {opacity:0}, {opacity:1, duration:0.6}, A27 - 0.1);
  tl.fromTo("#n27", {yPercent:105}, {yPercent:0, duration:0.8, ease:"power3.out"}, A27);
  const o27 = {v:0};
  tl.to(o27, {v:27, duration:1.5, ease:"power2.out", onUpdate:()=>{ document.querySelector("#n27").textContent = fmt(o27.v); }}, A27 + 0.05);
  tl.fromTo("#anos27", {yPercent:110}, {yPercent:0, duration:0.7, ease:"power3.out"}, A27 + 0.6);
  tl.fromTo("#big27", {scale:1}, {scale:1.06, duration:CARD_IN - A27, ease:"none"}, A27);
  tl.to(["#big27","#shadeC"], {opacity:0, duration:0.45}, CARD_IN - 0.1);
  tl.set(["#big27","#shadeC"], {display:"none"}, CARD_IN + 0.4);
  return tl;
}
window.__timelines = window.__timelines || {};
Promise.all([500,600,700,800].map(w => document.fonts.load(w + " 60px Poppins"))).then(() => document.fonts.ready).then(() => {
  window.__timelines["inovar27"] = build();
});
</script>
</body></html>
"""

clip_js = [[c[0], round(c[2], 3), round(c[3], 3), c[4]] for c in clips]
stat_js = [[s[0], s[1], s[2], s[3], round(s[5], 3), round(s[6], 3), s[7], "L"] for s in STATS]
lower_js = [[l[0], round(l[3], 3), round(l[4], 3)] for l in LOWER]
out = (HTML.replace("%%VIDS%%", vids).replace("%%STATS_LEFT%%", stats_left).replace("%%STATS_TEAM%%", stats_team)
       .replace("%%CLIPS%%", json.dumps(clip_js)).replace("%%STATS%%", json.dumps(stat_js))
       .replace("%%LOWER%%", json.dumps(lower_js)).replace("%%TEXTS%%", json.dumps(TEXTS)).replace("%%ASK_IN%%", f"{ASK_IN:.3f}").replace("%%ASK_OUT%%", f"{ASK_OUT:.3f}")
       .replace("%%A27%%", f"{N['a27']:.3f}").replace("%%CARD_IN%%", f"{CARD_IN:.3f}").replace("%%END%%", f"{END:.3f}"))
if "--reels" not in sys.argv:
    open(f"{HERE}/index.html", "w").write(out)
else:
    # Reels 1080x1920: entrevistas em tela cheia no rosto; takes 16:9 inteiros num quadro sobre fundo verde petróleo
    RD = os.path.join(HERE, "../comp-reels")
    for sub in ("assets/shots", "assets/fonts"):
        os.makedirs(f"{RD}/{sub}", exist_ok=True)
    for c in clips:
        if c[1]:
            shutil.copyfile(f"{HERE}/{c[1]}", f"{RD}/{c[1]}")
    for f in os.listdir(f"{HERE}/assets/fonts"):
        shutil.copyfile(f"{HERE}/assets/fonts/{f}", f"{RD}/assets/fonts/{f}")
    for f in ("gsap.min.js", "mix.wav"):
        shutil.copyfile(f"{HERE}/assets/{f}", f"{RD}/assets/{f}")
    shutil.copyfile(f"{HERE}/hyperframes.json", f"{RD}/hyperframes.json")
    REELS_CSS = """
/* ---------- Reels 1080x1920 ---------- */
#bgR{position:absolute;inset:0;z-index:1;background:radial-gradient(120% 80% at 30% 25%,#047c80 0%,var(--pet) 40%,var(--pet2) 100%);overflow:hidden}
#bgR .top{position:absolute;left:0;right:0;top:300px;text-align:center;font-weight:700;font-size:54px;letter-spacing:14px}
#bgR .top span{display:block;width:120px;height:8px;border-radius:4px;background:#fff;margin:22px auto 0;opacity:.85}
.shot.broll,.shot.raw{left:40px;top:690px;width:1000px;height:563px;inset:auto;border-radius:28px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
.shot.broll,.shot.raw{position:absolute;left:40px;top:690px;right:auto;bottom:auto}
.shot.talk .kb video{object-position:52% 50%}
.stat.oncard .num{font-size:190px;letter-spacing:-3px}
.stat.oncard .lbl{font-size:72px;padding:0 60px}
.card .ctext{left:80px;right:80px}
.card .cline{font-size:82px}
.lt{left:60px;bottom:470px}
.lt .name{font-size:66px}
.lt .role{font-size:50px}
#ask .t{padding:0 80px}
#ask .line{font-size:112px}
#big27 .num{font-size:300px}
#big27 .anos{font-size:104px}
"""
    r = (out.replace('width=1920, height=1080', 'width=1080, height=1920')
         .replace('width:1920px;height:1080px', 'width:1080px;height:1920px')
         .replace('data-width="1920" data-height="1080"', 'data-width="1080" data-height="1920"')
         .replace('data-composition-id="inovar27"', 'data-composition-id="inovar27reels"')
         .replace('window.__timelines["inovar27"]', 'window.__timelines["inovar27reels"]')
         .replace('</style>', REELS_CSS + '</style>')
         .replace('<div class="shot', '<div id="bgR">' + CURVES + '<div class="top">INOVAR · 27 ANOS<span></span></div></div>\n<div class="shot', 1))
    open(f"{RD}/index.html", "w").write(r)
    print("reels ok")
print("ok", len(clips), "imagens;", {k: round(v, 2) for k, v in N.items()}, "fim", END)
