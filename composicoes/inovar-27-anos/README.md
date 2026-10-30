# Vídeo institucional — Inovar 27 anos (TV, 16:9)

Cópia guardada da montagem. Takes, entrevistas, narração, música e renders ficam em
`video-projects/inovar-27-anos/` (fora do git); para renderizar, copie-os para os mesmos caminhos.

## Etapas (rodar a partir da pasta do projeto)
1. Vozes: `work/build_audio.py` corta e limpa a narração (pausas longas encurtadas) e os trechos das
   entrevistas (sem a voz da entrevistadora; ruído tirado com o silêncio do fim de cada gravação).
2. Plano: `work/plan.py` posiciona as vozes, define as seções e os takes de cada uma → `work/timeline.json`.
3. Imagens: `work/build_shots.py` deixa cada take em 1920x1080 (vertical 4K = recorte horizontal;
   vertical 1080 = laterais desfocadas do próprio take) com a cor do vídeo; `work/build_interviews.py`
   faz o vídeo das entrevistas sincronizado com as vozes. A folha de seleção sai de `work/make_sel.py`.
4. Trilha de reserva (a `musica.mp3` não veio na pasta): `work/musicgen.py` (piano, semente 3, só os
   primeiros 48,5 s) + `work/musicgen_clip.py` (orquestra, semente 5), montadas por `work/assemble_music.py`.
5. Mixagem: `work/mix.py` (música cresce até o fim e abaixa sob as vozes; -16 LUFS, pico até -1 dB).
6. Gráficos: `comp/build_comp.py` gera `comp/index.html` (números, nomes, "27 anos de Inovar é…", logo).

## Render
```bash
cd comp && npx hyperframes@0.8.166 render . -o renders/v1-imagem.mp4 -q looks --crf 18 -f 30
# TV: H.264 High, yuv420p, 12 Mbps (2 passadas), AAC 48 kHz, com assets/mix.wav
```
Fonte: Poppins (SIL Open Font License), via @fontsource/poppins.
