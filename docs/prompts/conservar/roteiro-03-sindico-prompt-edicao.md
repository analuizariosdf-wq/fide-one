# Prompt de edição: Roteiro 03, síndico (Conservar)

> Cole tudo abaixo da linha na sessão de edição.

---

Você é o editor de vídeo da **Conservar Terceirização e Condomínios**. Vamos editar um **Reels vertical 9:16 (1080×1920, 30 fps)** para o Instagram @conservar_terceirizacao. Público: **síndicos**. Este vídeo pede uma edição **mais dinâmica** que a dos anteriores, com atenção especial ao **primeiro take (a headline)**.

## Antes de começar

1. Busque o kit e o contexto da marca:
   ```bash
   git fetch origin claude/friendly-wozniak-1a81ge
   git checkout origin/claude/friendly-wozniak-1a81ge -- style-library/03-conservar style-library/registry.json docs/CONSERVAR-CONTEXTO.md
   ```
2. Leia `docs/CONSERVAR-CONTEXTO.md` (marca, cores, tom, regras), `docs/VIDEO-KIT.md` (seção Toolchain) e `style-library/03-conservar/DESIGN.md`.
3. Crie o projeto com `npm run new-video -- conservar-roteiro-03-sindico` e use o fluxo `/short-form-edit`. Brutos, transcrições e renders ficam em `video-projects/` e **nunca** vão para o git.
4. **Baixe os takes do Google Drive** para `video-projects/conservar-roteiro-03-sindico/` (pasta de brutos do projeto):
   - Pasta: https://drive.google.com/drive/folders/1tq1a49WbJ4ge-vxVcJqboY9iGnrD_BKF?usp=drive_link
   - Baixe **todos os arquivos da pasta**.
   - Use o `gdown`: `pip install gdown` e depois `gdown --folder "https://drive.google.com/drive/folders/1tq1a49WbJ4ge-vxVcJqboY9iGnrD_BKF" -O <pasta-de-brutos>`.
   - Liste os arquivos que vieram e rode `ffprobe` em cada um. Me diga quantos são e a duração, a resolução e o fps de cada um.
   - Se o download falhar por bloqueio de rede, me avise na hora. O ambiente precisa liberar `drive.google.com` e `drive.usercontent.google.com` em Allowed domains (configurações do ambiente → Network access), e a pasta precisa estar compartilhada como "qualquer pessoa com o link". Não siga sem os arquivos.
5. **Identifique a finalização padrão.** Na pasta há, além dos takes do roteiro, um vídeo de **finalização padrão da Conservar** (encerramento pronto). Descubra qual é pelo nome, pelo conteúdo ou pela transcrição e **me diga qual arquivo você identificou antes de editar**.
6. Fale comigo em português, simples e direto.

## Regras gerais

- Trabalhe **em 3 etapas, nesta ordem**, e **pare para minha aprovação ao fim de cada uma**. Não pule etapa nem adiante a próxima.
- Siga o roteiro abaixo. Não invente números, dados nem promessas.
- Paleta fechada: azul `#43506A`, azul escuro `#2F3A4F`, laranja `#F07C26`, cinza `#C2C6CD` e branco. No máximo **um destaque laranja por tela**. Nada de neon, glitch colorido ou outras cores.
- Logo: sempre a imagem (`assets/logo-conservar-branco.png` sobre o vídeo ou azul, `assets/logo-conservar.png` sobre fundo claro). Nunca digite "CONSERVAR" com fonte.
- Nada cobre o rosto de quem fala. Os elementos ficam no terço inferior ou nas laterais.
- Respeite a área segura do Reels: deixe livres os ~250 px de cima, os ~380 px de baixo (legenda e botões do app) e os ~140 px da direita (curtir, comentar, compartilhar).

## Finalização padrão (importante)

- O vídeo **termina com o arquivo de finalização padrão que está na pasta**. **Não crie** tela de encerramento com logo: a finalização já faz esse papel.
- Use a finalização **como está**: sem cortar o conteúdo, sem legenda e sem grafismo por cima. Só ajuste o volume para casar com o resto (-14 LUFS) e, se precisar, encaixe no 1080×1920 sem distorcer.
- A passagem para a finalização vem logo depois de "converse com a Conservar", com uma transição da marca (a curva laranja varrendo a tela, ~0,4 s) e um whoosh. A trilha do vídeo faz fade-out e entrega para o áudio da finalização, sem dois sons brigando.

## Roteiro

**CENA 1 (headline, primeiro take)**
"Se você é síndico e começa o dia perguntando quem faltou… tem alguma coisa errada."

**CENA 2 (o caos)**
"Funcionário atrasou. Alguém precisa substituir. O uniforme não chegou. O morador reclamou. A escala mudou. E no meio disso tudo, quem está resolvendo? O síndico."

**CENA 3 (a virada)**
"Só que existe um detalhe: você não deveria ter contratado um serviço para ganhar mais uma equipe para administrar. A terceirização deveria fazer justamente o contrário. Dar suporte, supervisão, cobertura e resposta rápida quando alguma coisa sai do planejado."

**CENA 4 (chamada)**
"Porque síndico já tem problema demais para resolver. Gerenciar falta de funcionário não deveria ser mais um deles. Se você terceirizou o serviço, mas continua cuidando da escala como se fosse o RH do condomínio, converse com a Conservar."

**+ FINALIZAÇÃO PADRÃO** (arquivo da pasta)

Duração alvo depois dos cortes: **45 a 60 s**, mais a finalização.

---

## ETAPA 1: vídeo cru, cortes e aprimoramento

1. Transcreva todos os takes localmente:
   `python3 scripts/transcribe-local.py <take> --language pt --model medium`
2. Mapeie cada take para a cena e a frase do roteiro. Se uma fala tiver várias tentativas, **escolha a melhor** (dicção, energia, olhar para a câmera, sem tropeço) e diga por quê. **No take da headline, priorize energia e expressão**: é o que segura a pessoa no vídeo.
3. Aponte **falas do roteiro que estejam faltando** em todos os takes.
4. Cortes (`/cut-silences` e depois `/cut-mistakes`):
   - Silêncios e respiros longos. **Ritmo mais acelerado** que o normal, mas sem cortar o fim das palavras. Deixe ~0,08 a 0,1 s de folga.
   - Gaguejadas, repetições, começos errados, "é…", "né", "tipo".
   - Improviso bom pode ficar, mas me avise.
   - A primeira palavra do vídeo é "Se você é síndico…", **sem nenhum respiro antes**.
   - Na **Cena 2**, a lista de problemas é rápida: frase colada em frase, quase sem pausa. A pausa de efeito fica só antes de "**O síndico.**" (~0,3 s).
   - Nas reticências da headline ("quem faltou… tem alguma coisa errada") mantenha uma batida curta (~0,2 s), que é onde entra o punch-in.
5. Cortes na mesma câmera: use **punch-ins** como recurso de ritmo, não só para disfarçar. Varie de 100% a ~120%, mudando a cada frase da Cena 2.
6. Aprimoramento do áudio da voz: redução de ruído suave, EQ para clareza, compressão leve e normalização para **-14 LUFS** integrado (pico ≤ -1 dBTP).
7. **Entregue para aprovação:**
   - qual arquivo é a finalização padrão;
   - tabela com take escolhido por frase e motivo;
   - lista de cortes (trecho, tempo, motivo);
   - duração final estimada;
   - um render de baixa resolução só com os cortes + a finalização no fim.

**Pare aqui e espere minha aprovação.**

## ETAPA 2: cor, qualidade e efeitos sonoros

1. **Cor:** correção natural, sem filtro. Balanço de branco neutro, pele natural, contraste levemente maior e o azul do uniforme fiel ao azul da marca (sem puxar para roxo nem ciano). **Igualar a cor entre todos os takes** e deixar a passagem para a finalização sem salto de cor estranho. A finalização em si não é recolorida.
2. **Qualidade:** nitidez leve, sem ruído digital exagerado. Exporte em 1080×1920, 30 fps, H.264, bitrate alto.
3. **Enquadramento 9:16:** rosto no terço superior/central, olhos na altura de ~1/3 da tela, sem cortar a cabeça mesmo nos punch-ins. Deixe espaço embaixo para a legenda.
4. **Trilha:** instrumental moderna com pulso marcado (beat leve, ~100 a 120 BPM), sem letra e livre de direitos. Volume baixo sob a voz (≈ -20 a -24 dB), com ducking. **Na Cena 2 a trilha pode subir um pouco de tensão**. Em "Só que existe um detalhe", **corte a trilha por ~0,5 s** (um "respiro" de silêncio) e volte mais leve. Fade-out antes da finalização. Se preferir que eu coloque a música pelo Instagram, me pergunte.
5. **Efeitos sonoros:** mais presentes que nos vídeos anteriores, mas ainda limpos:
   - som de **notificação de celular** (curto e discreto) em cada balão de problema da Cena 2;
   - **whoosh** em cada punch-in forte e nas transições;
   - **impacto grave** em "tem alguma coisa errada" e em "O síndico.";
   - "tick" leve em cada item da lista da Cena 3;
   - som de **risco/caneta** quando o texto for riscado na Cena 4.
   - Nada de efeito cômico (buzina, meme, risada). A voz é sempre o mais importante.
6. **Entregue para aprovação** o render com cor, música e efeitos sonoros (ainda sem grafismos), com a lista de efeitos e onde entram.

**Pare aqui e espere minha aprovação.**

## ETAPA 3: elementos, legendas e motions (versão mais dinâmica)

Use o kit (`style-library/03-conservar/`) como base de cores, fontes e logo, **adaptado para 9:16**. Neste vídeo os motions são **mais rápidos e com mais camadas** que o padrão: tipografia cinética, punch-ins sincronizados, balões de notificação e transições com a curva laranja. A identidade continua a mesma: paleta fechada, Montserrat, a curva laranja e nada que cubra o rosto.

**Ritmo de movimento deste vídeo:** entradas de 0,25 a 0,4 s (`power3.out` ou `expo.out`), saídas de 0,2 s, punch-ins de câmera de 0,15 a 0,25 s. É permitido um **leve camera shake** (2 a 4 px, ≤ 0,2 s) nos impactos. Nada de giros nem quiques.

### 3.1 HEADLINE: edição especial do primeiro take (0 a ~5 s)

É a parte mais importante do vídeo. Tem de prender nos 2 primeiros segundos.

- **Frame 0 já em movimento:** o vídeo abre com um **push-in lento** (zoom de 100% para ~112% durante a primeira frase). Nada de frame parado.
- Em "Se você é **síndico**": a palavra `SÍNDICO` entra **gigante** (Montserrat 900, branco, caixa alta), batendo de cima para baixo (scale 1,4 → 1 + aparecer, 0,25 s), na parte de cima da tela, **atrás da cabeça** se der para recortar a pessoa (remoção de fundo/máscara) ou acima dela sem cobrir o rosto.
- Em "começa o dia perguntando **quem faltou**": entra um **balão de notificação de celular** pela lateral, como uma mensagem de WhatsApp na tela de bloqueio. Cartão branco com texto azul `#43506A` e ponto laranja de notificação, com o horário `06:47` e a mensagem: `Bom dia… hoje não vou conseguir ir 😕`. Sem nome de pessoa real e sem logo do WhatsApp. Som de notificação.
- Nas reticências: tudo congela meio segundo.
- Em "**tem alguma coisa errada**": **punch-in seco** para ~125%, impacto grave, camera shake curto. O título `Tem alguma coisa errada` aparece no terço inferior com "alguma coisa errada" dentro do **bloco laranja**, que pinta rápido da esquerda para a direita. O `SÍNDICO` e o balão saem.
- Etiqueta pequena no topo, caixa alta e espaçada, em cinza, desde o frame 0: `PARA SÍNDICOS`.

### 3.2 Motions por cena

**CENA 2: o caos (~5 a ~17 s)**
- Cada problema vira um **balão de notificação** que entra exatamente na palavra falada, alternando lados (esquerda, direita, esquerda…) e **empilhando** nas laterais, sem cobrir o rosto. Cada um vem com som de notificação e o vídeo dá um **punch-in diferente a cada frase** (alterne 100%, 110%, 105%, 115%…):
  `Funcionário atrasou` → `Precisa de substituto` → `O uniforme não chegou` → `Morador reclamou` → `A escala mudou`
  Estilo: cartões brancos com texto azul e ícone pequeno em cinza, com um "badge" laranja de contagem que vai subindo (1, 2, 3, 4, 5).
- Em "E no meio disso tudo, **quem está resolvendo?**": os balões tremem de leve, a tela fica um pouco mais escura e o texto `Quem está resolvendo?` aparece em branco.
- Em "**O síndico.**": **corte seco para close** (punch-in ~125%), impacto grave, e todos os balões **caem/saem da tela de uma vez**. Selo `O SÍNDICO` dentro do bloco laranja no terço inferior, por ~1 s.

**CENA 3: a virada (~17 a ~32 s)**
- Em "**Só que existe um detalhe**": a trilha corta (respiro), o zoom volta para 100% com um movimento suave e a **curva laranja varre a tela** como transição, mudando o clima de caos para calma.
- Em "ganhar **mais uma equipe para administrar**": ícone de grupo de pessoas (branco, traço simples) com um `+1` laranja, que aparece e é **riscado**/sai em "deveria fazer **justamente o contrário**". Pode usar um "flip" rápido do cartão, de `+ trabalho` para `– preocupação`.
- Em "Dar suporte, supervisão, cobertura e resposta rápida": **grade 2×2 de cartões** (ou lista vertical com checks laranja) com ícones simples em branco, cada um entrando na palavra exata com "tick":
  `Suporte` ✓ `Supervisão` ✓ `Cobertura` ✓ `Resposta rápida` ✓
  Em "quando alguma coisa sai do planejado": o último cartão (`Resposta rápida`) ganha o destaque laranja e os outros esmaecem.

**CENA 4: chamada (~32 s até a finalização)**
- Em "síndico já tem **problema demais** para resolver": vários cartões de problema (os mesmos da Cena 2, menores) entram rápido em cascata e enchem as laterais.
- Em "**Gerenciar falta de funcionário** não deveria ser mais um deles": o cartão `Gerenciar falta de funcionário` vem para o centro do terço inferior e uma **linha laranja o risca** (som de caneta). Os outros somem.
- Em "continua cuidando da escala como se fosse o **RH do condomínio**": um **crachá** (cartão azul escuro com borda cinza) escrito `RH DO CONDOMÍNIO` entra balançando de leve, e um carimbo laranja `NÃO É SEU PAPEL` bate por cima (impacto). Se você achar que fica poluído, use só o crachá riscado.
- Em "**converse com a Conservar**": o texto `Converse com a Conservar` aparece no terço inferior, com "Conservar" em laranja, e logo depois a **curva laranja varre a tela** e entrega para a **finalização padrão**.

### 3.3 Capa do Reels

Gere a capa como **PNG 1080×1920** separado para eu subir como capa no Instagram. **Não** coloque a capa parada no início do vídeo.

- Fundo: o frame mais expressivo da headline (a pessoa olhando para a câmera, de preferência com expressão de "tem coisa errada"), com escurecimento azul `#2F3A4F` na parte de baixo.
- Etiqueta no topo: `PARA SÍNDICOS`.
- Texto (Montserrat 900, branco, frase com só a primeira letra maiúscula):
  **Síndico, você começa** / **o dia perguntando** / [**quem faltou?**]
  com "quem faltou?" dentro do bloco laranja.
- Logo branca pequena no rodapé.
- **Todo o texto dentro da área central 1080×1350** (é o recorte que aparece no grade do perfil) e sem cobrir o rosto.
- Faça também uma variação alternativa: "Você é síndico ou **RH do condomínio?**".

### 3.4 Conferência final

- `bash scripts/probe-mp4.sh out.mp4 1080x1920 30`
- `node scripts/preflight.mjs <projeto>`
- Confira frame a frame os pontos de sincronia: cada balão, cartão e punch-in cai na palavra certa, nenhum texto fica na área de UI do Reels e nenhum elemento cobre o rosto.
- Confira que os primeiros 2 s têm movimento desde o frame 0 e que a finalização padrão entra inteira, sem legenda nem grafismo por cima.
- **Entregue para aprovação:** o vídeo final, a capa (as duas versões) e uma lista de tudo que foi colocado e em que tempo.

**Pare e espere minha aprovação.** Depois dos ajustes, avise para eu **baixar os arquivos**, porque a sessão é temporária.

---

## PROMPT DE LEGENDAS (aplicar na Etapa 3)

Use `/caption-animation` com a transcrição palavra por palavra **já re-temporizada depois dos cortes**.

- **Estilo:** Montserrat 800, branco, com contorno/sombra suave em azul escuro `#2F3A4F` para ler sobre qualquer fundo. **A palavra que está sendo falada fica laranja `#F07C26`.**
- **Tamanho:** ~64 a 72 px em 1080×1920. Frases com só a primeira letra maiúscula, sem ponto final.
- **Blocos:** 2 a 4 palavras por vez, no máximo 2 linhas. Na Cena 2, blocos mais curtos (1 a 3 palavras) para acompanhar o ritmo rápido. Quebre nas pausas naturais, nunca no meio de uma expressão ("RH do condomínio" fica inteiro; "resposta rápida" também).
- **Posição:** centralizada, logo abaixo do queixo ou no terço inferior, **acima dos ~380 px de baixo** e fora dos ~140 px da direita. Nunca sobre o rosto. A legenda acompanha os punch-ins **sem mudar de lugar**: ela fica fixa na tela, não "dá zoom" com o vídeo.
- **Animação:** cada bloco entra com um leve subir e aparecer (0,12 s); a palavra ativa troca para laranja com um micro-scale de 1,0 para 1,08. Sem quique.
- **Palavras-chave** com destaque extra (só cor laranja fixa no bloco, sem outro efeito): `síndico`, `quem faltou`, `o síndico`, `contrário`, `resposta rápida`, `RH do condomínio`, `Conservar`.
- **Quando houver um título, balão, crachá ou lista na tela dizendo a mesma coisa**, esconda a legenda ou suba ela para não colidir. Na headline, a tipografia cinética **substitui** a legenda. Nunca dois textos brigando.
- **Ortografia:** confira contra o roteiro (acentos, "síndico", "condomínio", "supervisão", "Conservar"). A legenda segue o roteiro, não erros da transcrição.
- Na **finalização padrão** a legenda some.
- Gere também um `.srt` da versão final, para eu usar se precisar.
