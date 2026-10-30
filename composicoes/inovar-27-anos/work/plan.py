"""Plano do vídeo 27 anos: posição das vozes, seções e takes de cada seção.
Uso: python3 -I plan.py <projeto>   → work/timeline.json"""
import json, sys
P = sys.argv[1]
V = json.load(open(f"{P}/work/audio/voices.json"))
GAP = 0.65

# ordem das vozes e respiro antes de cada uma (v2: sem música, abertura e encerramento da cliente)
OPEN, CLOSE = 8.0, 6.5                      # durações de ABERTURA.mp4 e ENCERRAMENTO.mp4
ORDER = [("n1", 1.6), ("n2", None), ("n3", GAP), ("n4", GAP), ("kelly", 1.0), ("kelly2", 0.45),
         ("geo", 0.8), ("geo2", 0.45), ("n5", 0.9), ("kelly-cf", 2.4), ("geo-cf", 0.5), ("n6", 0.8)]
t, voices = 0.0, {}
for name, gap in ORDER:
    t = OPEN + 0.4 if gap is None else t + gap          # N2 entra logo depois da abertura
    voices[name] = {"start": round(t, 3), "dur": V[name]["dur"], "file": V[name]["file"]}
    t += V[name]["dur"]
n = lambda k: voices[k]
N6_INOVAR = 7.5                              # "Inovar." no bloco 6 → entra o encerramento
CLOSE_IN = round(n("n6")["start"] + N6_INOVAR, 3)
END = round(CLOSE_IN + CLOSE, 3)
sec = {   # janelas de imagem
    "abertura": (0, OPEN),
    "sede": (OPEN, n("n3")["start"] - 0.25),
    "bastidores": (n("n3")["start"] - 0.25, n("n4")["start"] - 0.25),
    "contratacoes": (n("n4")["start"] - 0.25, n("kelly")["start"] - 0.5),
    "kelly": (n("kelly")["start"] - 0.5, n("geo")["start"] - 0.4),
    "geovanna": (n("geo")["start"] - 0.4, n("n5")["start"] - 0.5),
    "equipe": (n("n5")["start"] - 0.5, n("kelly-cf")["start"] - 2.0),
    "pergunta": (n("kelly-cf")["start"] - 2.0, n("kelly-cf")["start"] - 0.15),
    "respostas": (n("kelly-cf")["start"] - 0.15, n("n6")["start"] - 0.2),
    "final": (n("n6")["start"] - 0.2, CLOSE_IN),
    "encerramento": (CLOSE_IN, END),
}
# takes: (arquivo, início, modo, velocidade). Só takes gravados deitados (16:9).
# ("CARD", tipo, conteúdo, 0) = tela animada com a informação no lugar de take (fundo verde petróleo).
SHOTS = {
    "abertura": [("v2/abertura", 0.0, "h", 1)],
    "sede": [("CARD", "stat", "s1999", 0), ("takes/20261027_142912", 3.0, "h", 1),
             ("takes/20261027_141002", 0.2, "h", 1), ("CARD", "text", "Por trás de cada vaga,|existe uma vida.", 0)],
    "bastidores": [("takes/20261027_140931", 1.2, "h", 1), ("CARD", "stat", "s350", 0),
                   ("takes/20261027_140940", 3.4, "h", 1), ("takes/20261027_140912", 3.5, "h", 1),
                   ("takes/20261027_142844", 14.0, "h", 1)],
    "contratacoes": [("CARD", "stat", "s19698", 0), ("takes/20261027_140912", 10.0, "h", 1),
                     ("CARD", "text", "Cada contratação,|um recomeço.", 0), ("takes/20261027_140825", 0.0, "h", 1)],
    "equipe": [("takes/20261029_125137", 9.0, "h", 1), ("takes/20261029_125204", 8.5, "h", 1),
               ("takes/20261027_140902", 0.0, "h", 1), ("CARD", "stat", "s300", 0),
               ("CARD", "stat", "s71", 0), ("takes/20261029_125218", 0.0, "h", 1)],
    "final": [("takes/20261027_140940", 9.5, "h", 1), ("takes/20261027_141002", 3.4, "h", 1)],
    "encerramento": [("v2/encerramento", 0.0, "h", 1)],
}
json.dump({"end": END, "voices": voices, "sections": sec, "shots": SHOTS}, open(f"{P}/work/timeline.json", "w"), indent=1)
for k, (a, b) in sec.items():
    print(f"{k:13s} {a:6.2f} → {b:6.2f}  ({b - a:5.2f} s)")
print("total", END)
