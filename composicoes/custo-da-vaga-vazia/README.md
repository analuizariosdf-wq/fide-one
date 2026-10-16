# Reel 02 — "O custo de uma vaga vazia"

Cópia guardada da composição. Vídeos, áudios, fotos e renders ficam em
`video-projects/custo-da-vaga-vazia/` (fora do git); para renderizar, copie-os para os
mesmos caminhos dentro desta pasta.

## Etapas
1. Corte: `work/build_cut.py` monta o corte dos takes (`raw/take01..04.mp4`) e gera `work/edl-approved.json`.
2. Cor e áudio: `work/stage2.py` (cor em `work/grade.json`, voz tratada, música, efeitos em `work/sfx-cues.json`,
   música muda 0,5 s em "Mas enquanto isso…").
   - Música: `work/musicgen.py` (MusicGen small, semente 11).
   - Efeitos criados por síntese: `work/synth_sfx.py` (contador/caixa, cha-ching, mergulho);
     os demais vêm do banco do projeto (Pixabay).
   - Áudio final com cartela + encerramento: `python3 -I work/stage2.py <projeto> mix 6.91 reel/assets/mix.wav`.
3. Gráficos: `reel/build_reel.py` gera `reel/index.html` (Reel) e `reel/cover/index.html` (capa).

## Mídia necessária (não versionada)
- `reel/assets/speaker.mp4` — primeiros 43,09 s de `edit/02-cor-audio.mp4`, sem áudio
- `reel/assets/mix.wav` — voz + música + efeitos, 50 s
- `reel/assets/encerramento.mp4` — take "ENCERRAMENTO DE VIDEO" da cliente
- `reel/cover/cover-photo.png` — FOTO DE CAPA convertida e com a cor do vídeo

## Render
```bash
cd reel && npx hyperframes@0.8.166 render . -o renders/reel-final.mp4 -q looks --crf 20 -f 30
cd cover && npx hyperframes@0.8.166 snapshot . --at 0.5 --no-end
```
Fontes: Montserrat (SIL Open Font License), via @fontsource/montserrat.
