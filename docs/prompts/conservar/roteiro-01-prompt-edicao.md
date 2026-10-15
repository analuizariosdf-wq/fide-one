# Prompt de edição: Roteiro 01 (Conservar)

> Cole tudo abaixo da linha na sessão de edição, junto com os takes.

---

Você é o editor de vídeo da **Conservar Terceirização e Condomínios**. Vamos editar um **Reels vertical 9:16 (1080×1920, 30 fps)** para o Instagram @conservar_terceirizacao.

## Antes de começar

1. Busque o kit e o contexto da marca:
   ```bash
   git fetch origin claude/friendly-wozniak-1a81ge
   git checkout origin/claude/friendly-wozniak-1a81ge -- style-library/03-conservar style-library/registry.json docs/CONSERVAR-CONTEXTO.md
   ```
2. Leia `docs/CONSERVAR-CONTEXTO.md` (marca, cores, tom, regras), `docs/VIDEO-KIT.md` (seção Toolchain) e `style-library/03-conservar/DESIGN.md`.
3. Crie o projeto com `npm run new-video -- conservar-roteiro-01` e use o fluxo `/short-form-edit`. Brutos, transcrições e renders ficam em `video-projects/` e **nunca** vão para o git.
4. Fale comigo em português, simples e direto.

## Regras gerais

- Trabalhe **em 3 etapas, nesta ordem**, e **pare para minha aprovação ao fim de cada uma**. Não pule etapa nem adiante a próxima.
- Siga o roteiro abaixo. Não invente números, dados nem promessas.
- Paleta fechada: azul `#43506A`, azul escuro `#2F3A4F`, laranja `#F07C26`, cinza `#C2C6CD` e branco. No máximo **um destaque laranja por tela**.
- Logo: sempre a imagem (`assets/logo-conservar-branco.png` sobre o vídeo ou azul, `assets/logo-conservar.png` sobre fundo claro). Nunca digite "CONSERVAR" com fonte.
- Nada cobre o rosto de quem fala. Os elementos ficam no terço inferior ou na lateral.
- Respeite a área segura do Reels: deixe livres os ~250 px de cima, os ~380 px de baixo (legenda e botões do app) e os ~140 px da direita (curtir, comentar, compartilhar).

## Roteiro

**CENA 1 (gancho)**
"Se você precisa cobrar a terceirizada todos os dias… você não terceirizou o problema. Você só mudou o nome de quem precisa cobrar."

**CENA 2 (a dor)**
"O gestor ainda confere se alguém faltou. Precisa perguntar se houve substituição. Fiscaliza uniforme. Cobra material. Acompanha qualidade. E resolve cada imprevisto. Só que esse não deveria ser o papel de quem contrata uma empresa especializada."

**CENA 3 (a virada)**
"Terceirização de verdade envolve gestão. Supervisão. Cobertura. Acompanhamento. E capacidade de resolver antes que o cliente precise pedir. Porque contratar uma terceirizada deveria diminuir a preocupação da empresa. Não criar mais uma coisa para administrar."

**CENA 4 (chamada)**
"Se hoje você precisa gerenciar a empresa que contratou para não precisar gerenciar a operação, talvez esteja na hora de rever essa parceria. Fale com a Conservar."

Duração alvo depois dos cortes: **45 a 60 s**.

---

## ETAPA 1: vídeo cru, cortes e aprimoramento

1. Transcreva todos os takes localmente:
   `python3 scripts/transcribe-local.py <take> --language pt --model medium`
2. Mapeie cada take para a cena e a frase do roteiro. Se uma fala tiver várias tentativas, **escolha a melhor** (dicção, energia, olhar para a câmera, sem tropeço) e diga por quê.
3. Aponte **falas do roteiro que estejam faltando** em todos os takes.
4. Cortes (`/cut-silences` e depois `/cut-mistakes`):
   - Silêncios e respiros longos. Ritmo de Reels, ágil, mas sem cortar o fim das palavras. Deixe ~0,1 s de folga.
   - Gaguejadas, repetições, começos errados, "é…", "né", "tipo".
   - Improviso bom pode ficar, mas me avise.
   - A primeira palavra do vídeo é a primeira palavra do gancho ("Se você…"), **sem nenhum respiro antes**.
   - Nas pausas de efeito do roteiro ("…", "Fiscaliza uniforme. Cobra material.") mantenha uma batida curta, sem matar o ritmo.
5. Saltos de corte na mesma câmera: disfarce com **punch-in leve** (zoom de 100% para ~110%, alternando) nos cortes, sem exagero.
6. Aprimoramento do áudio da voz: redução de ruído suave, EQ para clareza, compressão leve e normalização para **-14 LUFS** integrado (pico ≤ -1 dBTP).
7. **Entregue para aprovação:**
   - tabela com take escolhido por frase e motivo;
   - lista de cortes (trecho, tempo, motivo);
   - duração final estimada;
   - um render de baixa resolução só com os cortes.

**Pare aqui e espere minha aprovação.**

## ETAPA 2: cor, qualidade e efeitos sonoros

1. **Cor:** correção natural, sem filtro. Balanço de branco neutro, pele natural, contraste levemente maior e o azul da camiseta fiel ao azul da marca (sem puxar para roxo nem ciano). **Igualar a cor entre todos os takes.**
2. **Qualidade:** nitidez leve, sem ruído digital exagerado. Exporte em 1080×1920, 30 fps, H.264, bitrate alto.
3. **Enquadramento 9:16:** rosto no terço superior/central, olhos na altura de ~1/3 da tela, sem cortar a cabeça. Deixe espaço embaixo para a legenda.
4. **Trilha:** instrumental corporativa leve e confiante, sem letra, livre de direitos. Volume baixo sob a voz (≈ -20 a -24 dB), com ducking. Pode subir um pouco no encerramento. Se preferir que eu coloque a música pelo Instagram, me pergunte.
5. **Efeitos sonoros**, sutis e poucos:
   - whoosh curto nas entradas de tela cheia e na troca de cena;
   - "pop" ou "tick" leve em cada item de lista que aparece;
   - um impacto suave na palavra-chave do gancho ("o problema") e no "Fale com a Conservar".
   - Nada de efeito cômico nem som alto. A voz é sempre o mais importante.
6. **Entregue para aprovação** o render com cor, música e efeitos sonoros (ainda sem grafismos), com a lista de efeitos e onde entram.

**Pare aqui e espere minha aprovação.**

## ETAPA 3: elementos, legendas e motions

Use os elementos do kit (`style-library/03-conservar/cards/`) **adaptados para 9:16**. Os cards de lá são 16:9: crie as versões verticais mantendo cores, fontes e movimento, e salve no kit.

**Movimento da marca:** entradas com deslizar e aparecer (`power3.out`, 0,4 a 0,6 s); o bloco laranja "pinta" da esquerda para a direita atrás da palavra-chave; a curva laranja da logo varre o canto nas telas cheias; saídas rápidas (0,3 s). Nada de giros nem quiques.

### 3.1 Legendas (ver prompt de legendas abaixo)

### 3.2 Motions por cena (sincronizados com a fala)

**CENA 1: gancho (0 a ~6 s)**
- Desde o frame 0: etiqueta pequena no topo, caixa alta e espaçada, em cinza: `TERCEIRIZAÇÃO • GESTÃO`.
- Em "você não terceirizou **o problema**": título grande em branco, Montserrat 900, com "o problema" dentro do **bloco laranja** que pinta da esquerda para a direita + impacto sonoro.
- Em "só mudou o nome de quem precisa cobrar": o título sai rápido e fica só a legenda.

**CENA 2: a dor (~6 a ~20 s)**
- Na lateral (sem cobrir o rosto), uma **pilha de tarefas** que cresce a cada frase. Cartões azul-escuros `#2F3A4F` com texto branco e ícone em cinza (não use check, porque são problemas):
  `Conferir faltas` → `Cobrar substituição` → `Fiscalizar uniforme` → `Cobrar material` → `Acompanhar qualidade` → `Resolver imprevistos`
  Cada cartão entra exatamente na palavra falada, com um "tick" leve. A pilha pode tremer de leve quando ficar pesada.
- Em "esse **não deveria ser o papel** de quem contrata": a **curva laranja varre** a tela e limpa a pilha. Tela fica limpa.

**CENA 3: a virada (~20 a ~38 s)**
- Lista com **checks laranja** (card `t2-list`, versão vertical), item a item no tempo da fala:
  tag `TERCEIRIZAÇÃO DE VERDADE` · itens `Gestão` ✓ `Supervisão` ✓ `Cobertura` ✓ `Acompanhamento` ✓
- Em "resolver **antes que o cliente precise pedir**": a lista sai e entra uma frase de destaque com "antes de você pedir" em laranja.
- Em "deveria **diminuir a preocupação**… não criar mais uma coisa para administrar": tela de tese (card `t1-thesis` vertical) com "diminuir a preocupação" em destaque laranja. Pode ser tela cheia azul por ~2 s, com a voz por cima.

**CENA 4: chamada (~38 s ao fim)**
- Em "talvez esteja na hora de **rever essa parceria**": destaque em laranja no terço inferior.
- Em "**Fale com a Conservar**": **encerramento** de 2,5 a 3 s em tela azul `#43506A`. A curva laranja varre, a logo branca entra ao centro e embaixo aparecem a chamada `Fale com a Conservar` e as linhas `conservartc.com.br` e `@conservar_terceirizacao` em cinza. Impacto suave na entrada da logo.
- Logo branca pequena no rodapé ou canto superior durante o vídeo é **opcional**. Se usar, discreta e fora das áreas de UI.

### 3.3 Capa do Reels

Gere a capa como **PNG 1080×1920** separado para eu subir como capa no Instagram. **Não** coloque a capa parada no início do vídeo, porque o vídeo começa direto no gancho.

- Fundo: o melhor frame do apresentador (expressivo, olhando para a câmera), com escurecimento azul `#2F3A4F` na parte de baixo para o texto ler bem.
- Texto (Montserrat 900, branco, frase com só a primeira letra maiúscula):
  **Você terceirizou** / **ou só mudou** / **quem você** [**cobra?**]
  com "cobra?" dentro do bloco laranja.
- Etiqueta pequena acima do título: `TERCEIRIZAÇÃO`.
- Logo branca pequena no rodapé.
- **Todo o texto dentro da área central 1080×1350** (é o recorte que aparece no grade do perfil) e sem cobrir o rosto.
- Faça também uma variação alternativa: "Você ainda **cobra** a terceirizada todo dia?".

### 3.4 Conferência final

- `bash scripts/probe-mp4.sh out.mp4 1080x1920 30`
- `node scripts/preflight.mjs <projeto>`
- Confira frame a frame os pontos de sincronia: cada item da lista entra na palavra certa, nenhum texto fica na área de UI do Reels e nenhum elemento cobre o rosto.
- **Entregue para aprovação:** o vídeo final, a capa (as duas versões) e uma lista de tudo que foi colocado e em que tempo.

**Pare e espere minha aprovação.** Depois dos ajustes, avise para eu **baixar os arquivos**, porque a sessão é temporária.

---

## PROMPT DE LEGENDAS (aplicar na Etapa 3)

Use `/caption-animation` com a transcrição palavra por palavra **já re-temporizada depois dos cortes**.

- **Estilo:** Montserrat 800, branco, com contorno/sombra suave em azul escuro `#2F3A4F` para ler sobre qualquer fundo. **A palavra que está sendo falada fica laranja `#F07C26`.**
- **Tamanho:** ~64 a 72 px em 1080×1920. Frases com só a primeira letra maiúscula, sem ponto final.
- **Blocos:** 2 a 4 palavras por vez, no máximo 2 linhas. Quebre nas pausas naturais da fala, nunca no meio de uma expressão ("terceirizada / todos os dias", não "todos / os dias").
- **Posição:** centralizada, logo abaixo do queixo ou no terço inferior, **acima dos ~380 px de baixo** e fora dos ~140 px da direita. Nunca sobre o rosto.
- **Animação:** cada bloco entra com um leve subir e aparecer (0,15 s); a palavra ativa troca para laranja com um micro-scale de 1,0 para 1,06. Sem quique.
- **Palavras-chave** com destaque extra (só cor laranja fixa no bloco, sem outro efeito): `o problema`, `cobrar`, `gestão`, `antes`, `preocupação`, `rever essa parceria`, `Conservar`.
- **Quando houver um título ou uma lista na tela dizendo a mesma coisa**, esconda a legenda ou suba ela para não colidir. Nunca dois textos brigando.
- **Ortografia:** confira contra o roteiro (acentos, "terceirizada", "substituição", "Conservar"). A legenda segue o roteiro, não erros da transcrição.
- No **encerramento** a legenda some.
- Gere também um `.srt` da versão final, para eu usar se precisar.
