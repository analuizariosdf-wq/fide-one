# Reel 01 — "Você quer essa vaga ou só quer sair do seu emprego?"
\nCópia guardada da composição. Os arquivos de mídia ficam em `video-projects/voce-quer-essa-vaga/` (fora do git); para renderizar, copie-os para os mesmos caminhos dentro desta pasta.

Composição e scripts do Reel. Vídeos, áudios, fotos e renders ficam fora do git
(pasta `video-projects/` é ignorada); só a composição e o que a reconstrói estão aqui.

## Etapas
1. Corte: `work/build_cut.py` monta o corte a partir dos takes (`raw/take01..04.mp4`) e gera `work/edl-approved.json`.
2. Cor e áudio: `work/stage2.py` (correção por trecho em `work/grade.json`, voz tratada, música e efeitos em `work/sfx-cues.json`).
   `python3 -I work/stage2.py <projeto> mix 5.0 reel/assets/mix.wav` gera o áudio final com o encerramento.
   A música foi gerada com `work/musicgen.py` (MusicGen small).
3. Gráficos: `reel/build_reel.py` gera `reel/index.html` (Reel) e `reel/cover/index.html` (capa).

## Arquivos de mídia necessários (não versionados)
- `reel/assets/speaker.mp4` — vídeo com cor (sem áudio) de `edit/02-cor-audio.mp4`
- `reel/assets/mix.wav` — voz + música + efeitos, 53,82 s
- `reel/assets/encerramento.mp4` — take "ENCERRAMENTO DE VIDEO" da cliente
- `reel/cover/cover-photo.png` — frame de 7,45 s de `speaker.mp4`

## Render
```bash
cd reel && npx hyperframes@0.8.166 render . -o renders/reel-final.mp4 -q looks --crf 20 -f 30
cd cover && npx hyperframes@0.8.166 snapshot . --at 0.5 --no-end
```
Fontes: Montserrat (SIL Open Font License), via @fontsource/montserrat.
