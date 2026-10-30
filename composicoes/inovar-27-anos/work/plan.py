"""Plano do vídeo 27 anos: posição das vozes, seções e takes de cada seção.
Uso: python3 -I plan.py <projeto>   → work/timeline.json"""
import json, sys
P = sys.argv[1]
V = json.load(open(f"{P}/work/audio/voices.json"))
GAP = 0.65

# ordem das vozes e respiro antes de cada uma
ORDER = [("n1", 1.4), ("n2", 1.0), ("n3", GAP), ("n4", GAP), ("kelly", 1.1), ("kelly2", 0.45),
         ("geo", 0.8), ("geo2", 0.45), ("n5", 1.0), ("kelly-cf", 2.4), ("geo-cf", 0.5), ("n6", 0.9)]
t, voices = 0.0, {}
for name, gap in ORDER:
    t += gap
    voices[name] = {"start": round(t, 3), "dur": V[name]["dur"], "file": V[name]["file"]}
    t += V[name]["dur"]
END = round(t + 2.6, 2)
n = lambda k: voices[k]
sec = {   # janelas de imagem
    "abertura": (0, n("n2")["start"] - 0.3),
    "sede": (n("n2")["start"] - 0.3, n("n3")["start"] - 0.25),
    "bastidores": (n("n3")["start"] - 0.25, n("n4")["start"] - 0.25),
    "contratacoes": (n("n4")["start"] - 0.25, n("kelly")["start"] - 0.5),
    "kelly": (n("kelly")["start"] - 0.5, n("geo")["start"] - 0.4),
    "geovanna": (n("geo")["start"] - 0.4, n("n5")["start"] - 0.5),
    "equipe": (n("n5")["start"] - 0.5, n("kelly-cf")["start"] - 2.0),
    "pergunta": (n("kelly-cf")["start"] - 2.0, n("kelly-cf")["start"] - 0.15),
    "respostas": (n("kelly-cf")["start"] - 0.15, n("n6")["start"] - 0.2),
    "final": (n("n6")["start"] - 0.2, END),
}
# takes: (take, início no take, modo) — modo: "h" horizontal, "v4k@y" corte de vertical 4K (y = altura do centro 0-1),
# "blur" vertical 1080 com laterais desfocadas do próprio take. Duração = repartida na seção.
SHOTS = {
    "abertura": [("20261027_142912", 0.0, "h", 0.38)],                       # fachada com a placa da Inovar (câmera lenta)
    "sede": [("20261027_142912", 3.0, "h", 1), ("20261027_141002", 0.2, "h", 1),
             ("20261027_140902", 0.0, "h", 1), ("20261027_140825", 0.0, "h", 1),
             ("20260710_135031", 4.6, "v4k@0.45", 1)],
    "bastidores": [("20261027_140931", 1.2, "h", 1), ("20260710_135205", 0.0, "v4k@0.40", 0.8),
                   ("20261027_140940", 3.4, "h", 1), ("20260911_132740", 0.3, "blur", 1),
                   ("20261027_140912", 6.0, "h", 1)],
    "contratacoes": [("20260710_135046", 1.0, "v4k@0.55", 1), ("20260710_135127", 0.3, "v4k@0.62", 1),
                     ("20260710_135138", 11.0, "v4k@0.55", 1), ("20261027_140912", 10.0, "h", 1)],
    "equipe": [("20261029_125137", 9.0, "h", 1), ("20260710_132727", 0.5, "v4k@0.45", 1),
               ("20260710_132749", 0.6, "v4k@0.42", 1), ("20260710_132954", 0.0, "v4k@0.35", 1),
               ("20261029_125204", 8.5, "h", 1), ("20261027_142844", 14.0, "h", 1)],
    "final": [("20260710_132707", 7.2, "v4k@0.50", 1), ("20261027_140912", 11.3, "h", 1),
              ("20261027_141002", 3.4, "h", 1)],
}
json.dump({"end": END, "voices": voices, "sections": sec, "shots": SHOTS}, open(f"{P}/work/timeline.json", "w"), indent=1)
for k, (a, b) in sec.items():
    print(f"{k:13s} {a:6.2f} → {b:6.2f}  ({b - a:5.2f} s)")
print("total", END)
