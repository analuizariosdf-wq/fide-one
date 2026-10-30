"""Gera index.html do vídeo institucional "Inovar 27 anos" (TV, 1920x1080, 30 fps).

Lê ../work/timeline.json (vozes e seções), ../work/shots.json (takes já no formato 16:9)
e ../work/audio/voz-n*.json (palavras da narração tratada) para sincronizar os números.
Rode: python3 -I build_comp.py
"""
import json, os, shutil

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
order = ["abertura", "sede", "bastidores", "contratacoes", "kelly", "geovanna", "equipe", "respostas", "final"]
for sec in order:
    if sec in S:
        for s in S[sec]:
            clips.append((s["name"], f"assets/shots/{s['name']}.mp4", s["start"], s["dur"], "broll"))
    else:
        a, b = SEC[sec]
        clips.append((sec, f"assets/shots/{sec}.mp4", a, b - a + (0.0 if sec == "respostas" else 0.5), "talk"))
os.makedirs(f"{HERE}/assets/shots", exist_ok=True)
for c in clips:
    dst = f"{HERE}/{c[1]}"
    if os.path.exists(dst):
        os.remove(dst)
    shutil.copyfile(f"{W}/shots/{os.path.basename(c[1])}", dst)

# ---------- momentos dos gráficos ----------
N = dict(
    y1999=word("n2", "1999") - 0.15,
    i350=word("n3", "350") - 0.35,
    c19698=word("n4", "19") - 0.25,
    p300=word("n5", "300") - 0.3,
    e71=word("n5", "71") - 0.25,
    a27=VO["n6"]["start"] + 0.05,
    inovar=word("n6", "Inovar") - 0.35,
)
STATS = [  # id, número final, prefixo, sufixo, rótulo, entra, sai, separador de milhar
    ("s1999", 1999, "", "", "o começo", N["y1999"], VO["n2"]["start"] + 5.2, False),
    ("s350", 350, "+", " mil", "entrevistas", N["i350"], VO["n3"]["start"] + 9.0, False),
    ("s19698", 19698, "", "", "contratações", N["c19698"], VO["n4"]["start"] + 8.4, True),
    ("s300", 300, "+", "", "profissionais ativos", N["p300"], SEC["equipe"][1] - 0.6, False),
    ("s71", 71, "", "", "empresas clientes", N["e71"], SEC["equipe"][1] - 0.6, False),
]
LOWER = [("lt-kelly", "Kelly", "Gestora de Recursos Humanos", SEC["kelly"][0] + 0.9, VO["kelly2"]["start"] + 1.6),
         ("lt-geo", "Geovanna", "Recrutadora", SEC["geovanna"][0] + 0.8, VO["geo2"]["start"] + 2.6)]
ASK_IN, ASK_OUT = SEC["pergunta"][0], SEC["respostas"][0] + 0.25
CARD_IN = N["inovar"]


def stat_html(sid, label):
    big = "big" if sid in ("s1999", "s350", "s19698") else "mid"
    return (f'<div id="{sid}" class="stat {big}"><div class="bar"></div>'
            f'<div class="mask"><div class="num" id="{sid}-n">0</div></div>'
            f'<div class="mask"><div class="lbl">{label}</div></div><div class="uline"></div></div>')


vids = "\n".join(
    f'<div class="shot" id="w-{c[0]}" style="z-index:{10 + i}"><div class="kb" id="k-{c[0]}">'
    f'<video id="{c[0]}" class="clip" src="{c[1]}" muted playsinline data-start="{c[2]:.3f}" '
    f'data-duration="{c[3]:.3f}" data-track-index="{i % 2}"></video></div></div>'
    for i, c in enumerate(clips))

stats_left = "".join(stat_html(s[0], s[4]) for s in STATS[:3])
stats_team = stat_html("s300", "profissionais ativos") + stat_html("s71", "empresas clientes")

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
#s300{bottom:430px}
#s71{bottom:110px}
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
#fade{position:absolute;inset:0;z-index:900;background:#000;opacity:1}
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
<div id="card">
  <svg class="curves" viewBox="0 0 1920 1080" preserveAspectRatio="none">
    <path id="cc1" d="M-80 1040 C 560 930, 1300 960, 2000 880" fill="none" stroke="#036B6E" stroke-width="56" stroke-linecap="round"/>
    <path id="cc2" d="M-80 1120 C 600 1010, 1340 1040, 2000 960" fill="none" stroke="#024D52" stroke-width="80" stroke-linecap="round"/>
    <path id="cc3" d="M-80 80 C 420 -10, 1000 40, 2000 -60" fill="none" stroke="rgba(3,107,110,.18)" stroke-width="44" stroke-linecap="round"/>
  </svg>
  <img id="logo" src="assets/logo-inovar.png" alt="Inovar Recursos Humanos">
  <div id="tag"><div class="mask"><div class="l1" id="tag1">27 anos conectando talentos ao sucesso das empresas</div></div>
    <div class="mask"><div class="l2" id="tag2">DESDE 1999</div></div></div>
</div>
<div id="fade"></div>
</div>
<script>
const CLIPS = %%CLIPS%%;
const STATS = %%STATS%%;
const LOWER = %%LOWER%%;
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
    if (kind === "broll") tl.fromTo(k, {scale:1.0}, {scale:1.07, ease:"none", duration:dur}, start);
    if (i === 0) return;
    const prev = CLIPS[i-1];
    const pw = "#w-" + prev[0];
    const tin = start, d = 0.55;
    const push = (i % 3 === 1) && kind === "broll" && prev[3] === "broll";
    if (push) {
      tl.fromTo(w, {xPercent:100, filter:"blur(14px)"}, {xPercent:0, filter:"blur(0px)", duration:d, ease:"power3.inOut"}, tin);
      tl.fromTo(pw, {xPercent:0, filter:"blur(0px)"}, {xPercent:-35, filter:"blur(14px)", duration:d, ease:"power3.inOut", immediateRender:false}, tin);
    } else {
      tl.fromTo(w, {opacity:0, scale:1.10}, {opacity:1, scale:1, duration:d + 0.15, ease:"power2.out"}, tin);
    }
  });
  // ---- abertura e final
  tl.fromTo("#fade", {opacity:1}, {opacity:0, duration:1.6, ease:"power1.inOut"}, 0);
  tl.to("#fade", {opacity:1, duration:0.9, ease:"power1.in"}, END - 0.9);
  // ---- números
  STATS.forEach(s => {
    const [id, val, pre, suf, tin, tout, dot, side] = s;
    const el = "#" + id;
    tl.set(el, {display:"block"}, tin);
    tl.set(el, {display:"none"}, tout + 0.6);
    if (side === "L") tl.fromTo("#shade", {opacity:0}, {opacity:1, duration:0.6, ease:"power1.out", immediateRender:false}, tin - 0.2);
    tl.fromTo(el + " .bar", {scaleY:0}, {scaleY:1, duration:0.7, ease:"power3.out"}, tin);
    tl.fromTo(el + " .num", {yPercent:105}, {yPercent:0, duration:0.75, ease:"power3.out"}, tin + 0.05);
    const o = {v:0};
    tl.to(o, {v:val, duration:1.7, ease:"power2.out", onUpdate:()=>{ document.querySelector(el + "-n").textContent = pre + fmt(o.v, dot) + suf; }}, tin + 0.1);
    tl.set(o, {v:0}, tin);
    tl.fromTo(el + " .lbl", {yPercent:110}, {yPercent:0, duration:0.7, ease:"power3.out"}, tin + 0.45);
    tl.fromTo(el + " .uline", {scaleX:0}, {scaleX:1, duration:0.9, ease:"power3.out"}, tin + 0.55);
    tl.to([el + " .num", el + " .lbl"], {yPercent:-110, duration:0.5, ease:"power2.in"}, tout);
    tl.to([el + " .bar"], {scaleY:0, duration:0.45, ease:"power2.in"}, tout + 0.05);
    tl.to([el + " .uline"], {scaleX:0, duration:0.45, ease:"power2.in"}, tout);
    if (side === "L" && id !== "s300") tl.to("#shade", {opacity:0, duration:0.6}, tout + 0.15);
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
  // ---- encerramento com a logo
  tl.set("#card", {display:"block"}, CARD_IN);
  tl.fromTo("#card", {clipPath:"circle(0% at 50% 50%)"}, {clipPath:"circle(80% at 50% 50%)", duration:0.8, ease:"power3.inOut"}, CARD_IN);
  tl.set(["#big27","#shadeC"], {display:"none"}, CARD_IN + 0.8);
  ["#cc1","#cc2","#cc3"].forEach((p, j) => tl.fromTo(p, {xPercent:-40, opacity:0}, {xPercent:0, opacity:1, duration:1.6, ease:"power2.out"}, CARD_IN + 0.2 + 0.12*j));
  tl.fromTo("#logo", {opacity:0, scale:0.82, clipPath:"inset(100% 0 0 0)"}, {opacity:1, scale:1, clipPath:"inset(0% 0 0 0)", duration:1.1, ease:"power3.out"}, CARD_IN + 0.45);
  tl.fromTo("#tag1", {yPercent:110}, {yPercent:0, duration:0.8, ease:"power3.out"}, CARD_IN + 1.2);
  tl.fromTo("#tag2", {yPercent:110}, {yPercent:0, duration:0.8, ease:"power3.out"}, CARD_IN + 1.6);
  tl.fromTo("#logo", {y:0}, {y:-8, duration:END - CARD_IN - 1.5, ease:"sine.inOut"}, CARD_IN + 1.5);
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
       .replace("%%LOWER%%", json.dumps(lower_js)).replace("%%ASK_IN%%", f"{ASK_IN:.3f}").replace("%%ASK_OUT%%", f"{ASK_OUT:.3f}")
       .replace("%%A27%%", f"{N['a27']:.3f}").replace("%%CARD_IN%%", f"{CARD_IN:.3f}").replace("%%END%%", f"{END:.3f}"))
open(f"{HERE}/index.html", "w").write(out)
print("ok", len(clips), "imagens;", {k: round(v, 2) for k, v in N.items()}, "fim", END)
