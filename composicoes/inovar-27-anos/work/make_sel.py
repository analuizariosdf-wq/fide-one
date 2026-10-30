"""Folha de seleção (2 quadros por take, já no formato de TV). Uso: python3 -I make_sel.py <projeto>"""
import json, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
os.chdir(sys.argv[1])
S = json.load(open('work/shots.json'))
F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
labels = {'abertura': '1. Abertura — fachada (N1)', 'sede': '2. A sede — "1999" (N2)',
          'bastidores': '3. Bastidores — "+350 mil entrevistas" (N3)', 'contratacoes': '4. Pessoas — "19.698 contratações" (N4)',
          'kelly': '5. Kelly — gestora de Recursos Humanos', 'geovanna': '6. Geovanna — recrutadora',
          'equipe': '7. Equipe e treinamentos — "+300" e "71" (N5)', 'respostas': '8. "27 anos de Inovar é…" — respostas',
          'final': '9. "27 ANOS" + logo (N6)'}
E = 'raw/entrevistas/entrevista-'
EXTRA = {'kelly': [(E + 'kelly-pergunta-04.mp4', 6), (E + 'kelly-pergunta-05.mp4', 11)],
         'geovanna': [(E + 'geovana-pergunta-02.mp4', 10), (E + 'geovana-pergunta-04.mp4', 7)],
         'respostas': [(E + 'kelly-complete-a-frase.mp4', 5.2), (E + 'geovana-complete-a-frase.mp4', 5)]}
def grab(src, t):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', src, '-frames:v', '1', '-vf', 'scale=384:216', 'work/sel/_t.png'], check=True)
    return Image.open('work/sel/_t.png').copy()
rows = []
for sec, lab in labels.items():
    ims = [grab(f"work/shots/{s['name']}.mp4", s['dur'] * f) for s in S.get(sec, []) for f in (0.3, 0.75)]
    ims += [grab(a, b) for a, b in EXTRA.get(sec, [])]
    rows.append((lab, ims))
W = 388 * 6 + 30; H = sum(50 + ((len(i) + 5) // 6) * 226 for _, i in rows) + 20
im = Image.new('RGB', (W, H), '#0f1e1f'); d = ImageDraw.Draw(im); y = 10
for lab, ims in rows:
    d.text((20, y + 8), lab, font=F2, fill='#7fd6d8'); y += 50
    for k, x in enumerate(ims):
        im.paste(x, (20 + (k % 6) * 388, y + (k // 6) * 226))
    y += ((len(ims) + 5) // 6) * 226
im.save('work/sel/selecao-takes.jpg', quality=85)
