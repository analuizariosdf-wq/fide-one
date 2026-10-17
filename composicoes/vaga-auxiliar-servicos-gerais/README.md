# Reel 03 — Vaga: Auxiliar de Serviços Gerais

Cópia guardada da composição. Vídeos, áudios, fotos e renders ficam em
`video-projects/vaga-auxiliar-servicos-gerais/` (fora do git); para renderizar, copie-os para os
mesmos caminhos dentro desta pasta.

WhatsApp da vaga: **(31) 97231-7190** (constante `PHONE` em `reel/build_reel.py`; não foi falado nos takes,
aparece só na tela).

## Etapas
1. Corte agressivo guiado pelo áudio: `work/build_cut.py` → `work/edl-approved.json`.
2. Cor e áudio: `work/stage2.py` (cor em `work/grade.json`, efeitos em `work/sfx-cues.json`).
   - Música: `work/musicgen.py` (MusicGen small, semente 5, 120 bpm, batidas alinhadas aos cortes de cena).
   - Efeitos criados por síntese: `work/synth_sfx.py` (alerta, carimbo, máquina de escrever, aviãozinho,
     teclas DTMF de cada dígito do telefone, tique-taque + ding). "Pop" do banco do projeto (Pixabay).
   - Áudio final com cartela + encerramento: `python3 -I work/stage2.py <projeto> mix 7.0 reel/assets/mix.wav`.
3. Gráficos: `reel/build_reel.py` gera `reel/index.html` (Reel) e `reel/cover/index.html` (capa).
   Ícone do WhatsApp: simple-icons@16.35.0 (CC0), ver `reel/assets/whatsapp.PROVENIENCIA.txt`.

## Mídia necessária (não versionada)
- `reel/assets/speaker.mp4` — primeiros 38,95 s de `edit/02-cor-audio.mp4`, sem áudio
- `reel/assets/mix.wav` — voz + música + efeitos, 45,95 s
- `reel/assets/encerramento.mp4` — take "ENCERRAMENTO DE VIDEO" da cliente
- `reel/cover/cover-photo.png` — FOTO CAPA convertida, com a cor do vídeo

## Render
```bash
cd reel && npx hyperframes@0.8.166 render . -o renders/reel-final.mp4 -q looks --crf 20 -f 30
cd cover && npx hyperframes@0.8.166 snapshot . --at 0.5 --no-end
```
Fontes: Montserrat e Bebas Neue (SIL Open Font License), via @fontsource.
