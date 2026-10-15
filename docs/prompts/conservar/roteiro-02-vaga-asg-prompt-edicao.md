# Prompt de edição: Roteiro 02, vaga ASG (Conservar)

> Cole tudo abaixo da linha na sessão de edição.

---

Você é o editor de vídeo da **Conservar Terceirização e Condomínios**. Vamos editar um **Reels vertical 9:16 (1080×1920, 30 fps)** para o Instagram @conservar_terceirizacao. É um vídeo de **divulgação de vaga** (Auxiliar de Serviços Gerais).

## Antes de começar

1. Busque o kit e o contexto da marca:
   ```bash
   git fetch origin claude/friendly-wozniak-1a81ge
   git checkout origin/claude/friendly-wozniak-1a81ge -- style-library/03-conservar style-library/registry.json docs/CONSERVAR-CONTEXTO.md
   ```
2. Leia `docs/CONSERVAR-CONTEXTO.md` (marca, cores, tom, regras), `docs/VIDEO-KIT.md` (seção Toolchain) e `style-library/03-conservar/DESIGN.md`.
3. Crie o projeto com `npm run new-video -- conservar-roteiro-02-vaga-asg` e use o fluxo `/short-form-edit`. Brutos, transcrições e renders ficam em `video-projects/` e **nunca** vão para o git.
4. **Baixe os takes do Google Drive** para `video-projects/conservar-roteiro-02-vaga-asg/` (pasta de brutos do projeto):
   - Pasta: https://drive.google.com/drive/folders/1ub8KPURXBP8OP0nIert3i9wil8oDx6zI?usp=drive_link
   - Baixe **todos os takes da pasta**.
   - Use o `gdown`: `pip install gdown` e depois `gdown --folder "https://drive.google.com/drive/folders/1ub8KPURXBP8OP0nIert3i9wil8oDx6zI" -O <pasta-de-brutos>`.
   - Liste os arquivos que vieram e rode `ffprobe` em cada um. Me diga quantos takes são e a duração, a resolução e o fps de cada um.
   - Se o download falhar por bloqueio de rede, me avise na hora. O ambiente precisa liberar `drive.google.com` e `drive.usercontent.google.com` em Allowed domains (configurações do ambiente → Network access), e a pasta precisa estar compartilhada como "qualquer pessoa com o link". Não siga sem os takes.
5. Fale comigo em português, simples e direto.

## Regras gerais

- Trabalhe **em 3 etapas, nesta ordem**, e **pare para minha aprovação ao fim de cada uma**. Não pule etapa nem adiante a próxima.
- Siga o roteiro abaixo. Não invente números, dados, benefícios nem promessas. Os dados da vaga são só os do roteiro.
- Paleta fechada: azul `#43506A`, azul escuro `#2F3A4F`, laranja `#F07C26`, cinza `#C2C6CD` e branco. No máximo **um destaque laranja por tela**. O ícone do WhatsApp entra em branco ou laranja, **nunca no verde do WhatsApp**.
- Logo: sempre a imagem (`assets/logo-conservar-branco.png` sobre o vídeo ou azul, `assets/logo-conservar.png` sobre fundo claro). Nunca digite "CONSERVAR" com fonte.
- Nada cobre o rosto de quem fala. Os elementos ficam no terço inferior ou na lateral.
- Respeite a área segura do Reels: deixe livres os ~250 px de cima, os ~380 px de baixo (legenda e botões do app) e os ~140 px da direita (curtir, comentar, compartilhar).
- Tom: acolhedor e profissional, convidativo. É um convite, não um anúncio frio.

## ⚠️ Telefone (importante)

A apresentadora **não fala o número de telefone** no vídeo gravado. O número entra **só na edição, como texto na tela**:

**WhatsApp: (31) 97231-7190**

- Escreva **exatamente** assim e confira dígito por dígito: `(31) 97231-7190`.
- Ele aparece em dois momentos: (1) quando ela fala "Envie seu currículo pelo WhatsApp", e (2) no encerramento.
- Somando os dois momentos, o número precisa ficar **pelo menos 5 s na tela**, grande e legível, para dar tempo de anotar ou tirar print.

## Roteiro

**CENA 1 (gancho)**
"A Conservar está procurando gente para fazer parte do nosso time."

**CENA 2 (a vaga)**
"Estamos com vaga aberta para Auxiliar de Serviços Gerais. Se você já tem experiência na função, tem disponibilidade para trabalhar em condomínios e empresas e procura uma nova oportunidade, queremos conhecer você."

**CENA 3 (condições e perfil)**
"A jornada é de 36 horas semanais, de segunda a sexta-feira, em horário comercial. O salário é a combinar. Aqui, buscamos profissionais comprometidos, responsáveis e que entendam que um serviço bem feito faz diferença todos os dias."

**CENA 4 (chamada)**
"Quer trabalhar com a gente? Envie seu currículo pelo WhatsApp e participe do nosso processo seletivo. E se conhece alguém com esse perfil, compartilhe essa oportunidade."
*(No roteiro original o número vem depois de "WhatsApp", mas ela não o fala. Ele entra só na tela.)*

Duração alvo depois dos cortes: **35 a 50 s**, mais o encerramento.

---

## ETAPA 1: vídeo cru, cortes e aprimoramento

1. Transcreva todos os takes localmente:
   `python3 scripts/transcribe-local.py <take> --language pt --model medium`
2. Mapeie cada take para a cena e a frase do roteiro. Se uma fala tiver várias tentativas, **escolha a melhor** (dicção, energia, sorriso e simpatia, olhar para a câmera, sem tropeço) e diga por quê.
3. Aponte **falas do roteiro que estejam faltando** em todos os takes. A ausência do número de telefone é esperada e não conta como falta.
4. Cortes (`/cut-silences` e depois `/cut-mistakes`):
   - Silêncios e respiros longos. Ritmo de Reels, ágil, mas sem cortar o fim das palavras. Deixe ~0,1 s de folga.
   - Gaguejadas, repetições, começos errados, "é…", "né", "tipo".
   - Improviso bom pode ficar, mas me avise.
   - A primeira palavra do vídeo é a primeira palavra do gancho ("A Conservar…"), **sem nenhum respiro antes**.
   - Se ela tiver tentado falar o número em algum take, **corte essa parte**.
   - Depois de "Envie seu currículo pelo WhatsApp", **não deixe uma pausa vazia** onde seria o número: emende direto em "e participe…". O número aparece na tela por cima.
5. Saltos de corte na mesma câmera: disfarce com **punch-in leve** (zoom de 100% para ~110%, alternando) nos cortes, sem exagero.
6. Aprimoramento do áudio da voz: redução de ruído suave, EQ para clareza, compressão leve e normalização para **-14 LUFS** integrado (pico ≤ -1 dBTP).
7. **Entregue para aprovação:**
   - tabela com take escolhido por frase e motivo;
   - lista de cortes (trecho, tempo, motivo);
   - duração final estimada;
   - um render de baixa resolução só com os cortes.

**Pare aqui e espere minha aprovação.**

## ETAPA 2: cor, qualidade e efeitos sonoros

1. **Cor:** correção natural, sem filtro. Balanço de branco neutro, pele natural, contraste levemente maior e o azul do uniforme fiel ao azul da marca (sem puxar para roxo nem ciano). **Igualar a cor entre todos os takes.**
2. **Qualidade:** nitidez leve, sem ruído digital exagerado. Exporte em 1080×1920, 30 fps, H.264, bitrate alto.
3. **Enquadramento 9:16:** rosto no terço superior/central, olhos na altura de ~1/3 da tela, sem cortar a cabeça. Deixe espaço embaixo para a legenda e para os cartões de informação.
4. **Trilha:** instrumental leve, positiva e acolhedora, sem letra e livre de direitos. Volume baixo sob a voz (≈ -20 a -24 dB), com ducking. Pode subir um pouco no encerramento. Se preferir que eu coloque a música pelo Instagram, me pergunte.
5. **Efeitos sonoros**, sutis e poucos:
   - whoosh curto nas entradas de tela cheia e na troca de cena;
   - "pop" ou "tick" leve em cada item de lista ou cartão que aparece;
   - um impacto suave em "vaga aberta" e na entrada do número do WhatsApp.
   - Nada de efeito cômico nem som alto. A voz é sempre o mais importante.
6. **Entregue para aprovação** o render com cor, música e efeitos sonoros (ainda sem grafismos), com a lista de efeitos e onde entram.

**Pare aqui e espere minha aprovação.**

## ETAPA 3: elementos, legendas e motions

Use os elementos do kit (`style-library/03-conservar/cards/`) **adaptados para 9:16**. Se ainda não existirem versões verticais no kit, crie-as mantendo cores, fontes e movimento, e salve no kit.

**Movimento da marca:** entradas com deslizar e aparecer (`power3.out`, 0,4 a 0,6 s); o bloco laranja "pinta" da esquerda para a direita atrás da palavra-chave; a curva laranja da logo varre o canto nas telas cheias; saídas rápidas (0,3 s). Nada de giros nem quiques.

### 3.1 Legendas (ver prompt de legendas abaixo)

### 3.2 Motions por cena (sincronizados com a fala)

**CENA 1: gancho (0 a ~4 s)**
- Desde o frame 0: etiqueta no topo, caixa alta e espaçada, em cinza: `OPORTUNIDADE • ASG` (mesmo padrão do post de vaga do feed).
- Em "procurando gente para fazer parte do **nosso time**": título grande em branco, Montserrat 900, com "nosso time" dentro do **bloco laranja** que pinta da esquerda para a direita.

**CENA 2: a vaga (~4 a ~15 s)**
- Em "vaga aberta para **Auxiliar de Serviços Gerais**": cartão de destaque no terço inferior. Selo laranja pequeno `VAGA ABERTA` em cima e, embaixo, `Auxiliar de Serviços Gerais` em branco, grande. Impacto suave.
- Em "Se você…": lista com **checks laranja** (card `t2-list` vertical), item a item no tempo da fala:
  tag `QUEREMOS CONHECER VOCÊ SE` · itens `Tem experiência na função` ✓ `Tem disponibilidade para condomínios e empresas` ✓ `Procura uma nova oportunidade` ✓
- Em "queremos conhecer você": a lista sai rápido.

**CENA 3: condições e perfil (~15 a ~30 s)**
- Cartões de informação que entram um a um, no tempo da fala, na lateral ou no terço inferior. Azul escuro `#2F3A4F`, texto branco e ícone pequeno em cinza:
  - em "36 horas semanais": `36h semanais`, com o "36h" grande (pode usar o card `t1-stat` vertical, kicker `JORNADA`)
  - em "segunda a sexta-feira": `Segunda a sexta`
  - em "horário comercial": `Horário comercial`
  - em "salário a combinar": `Salário a combinar`
  Os quatro ficam juntos na tela por ~1 s depois do último e saem.
- Em "buscamos profissionais **comprometidos, responsáveis**": as duas palavras aparecem uma de cada vez, em branco, grandes. Só "comprometidos" ganha o bloco laranja.
- Em "um serviço bem feito faz diferença **todos os dias**": frase curta no terço inferior, com "todos os dias" em laranja.

**CENA 4: chamada (~30 s ao fim)**
- Em "Quer trabalhar **com a gente**?": destaque curto no terço inferior.
- Em "Envie seu currículo pelo **WhatsApp**": entra o **cartão do WhatsApp** no terço inferior, grande, com ícone do WhatsApp em branco + `(31) 97231-7190` em Montserrat 900 branco, sobre um cartão azul `#2F3A4F` com borda ou sublinhado laranja. Acima, uma linha pequena: `Envie seu currículo`. Impacto suave na entrada. Ele **fica na tela** até ela terminar "processo seletivo".
- Em "se conhece alguém com esse perfil, **compartilhe**": ícone de compartilhar (avião de papel do Instagram, em branco) com a palavra `Compartilhe` e uma seta apontando para o lado direito da tela, onde fica o botão de compartilhar do Reels (sem invadir a área de UI).
- **Encerramento** de **4 s** (mais longo que o normal, para dar tempo de anotar), em tela azul `#43506A`. A curva laranja varre e a logo branca entra no alto. No centro, `Envie seu currículo` e o ícone do WhatsApp com **`(31) 97231-7190` grande**. Embaixo, em cinza: `Vaga: Auxiliar de Serviços Gerais` e `@conservar_terceirizacao`.

### 3.3 Capa do Reels

Gere a capa como **PNG 1080×1920** separado para eu subir como capa no Instagram. **Não** coloque a capa parada no início do vídeo, porque o vídeo começa direto no gancho.

- Fundo: o melhor frame da apresentadora (sorrindo, olhando para a câmera), com escurecimento azul `#2F3A4F` na parte de baixo para o texto ler bem.
- Etiqueta no topo: `OPORTUNIDADE • ASG`.
- Texto (Montserrat 900, branco, frase com só a primeira letra maiúscula):
  **Vaga aberta** / **para Auxiliar de** / [**Serviços Gerais**]
  com "Serviços Gerais" dentro do bloco laranja.
- Linha de apoio pequena: `Envie seu currículo: (31) 97231-7190`.
- Logo branca pequena no rodapé.
- **Todo o texto dentro da área central 1080×1350** (é o recorte que aparece no grade do perfil) e sem cobrir o rosto.
- Faça também uma variação alternativa: "A Conservar está **contratando**".

### 3.4 Conferência final

- `bash scripts/probe-mp4.sh out.mp4 1080x1920 30`
- `node scripts/preflight.mjs <projeto>`
- Confira o **número de telefone** no vídeo e na capa, dígito por dígito: `(31) 97231-7190`.
- Confira que o número fica pelo menos 5 s na tela, somando os dois momentos.
- Confira frame a frame os pontos de sincronia: cada item e cartão entra na palavra certa, nenhum texto fica na área de UI do Reels e nenhum elemento cobre o rosto.
- **Entregue para aprovação:** o vídeo final, a capa (as duas versões) e uma lista de tudo que foi colocado e em que tempo.

**Pare e espere minha aprovação.** Depois dos ajustes, avise para eu **baixar os arquivos**, porque a sessão é temporária.

---

## PROMPT DE LEGENDAS (aplicar na Etapa 3)

Use `/caption-animation` com a transcrição palavra por palavra **já re-temporizada depois dos cortes**.

- **Estilo:** Montserrat 800, branco, com contorno/sombra suave em azul escuro `#2F3A4F` para ler sobre qualquer fundo. **A palavra que está sendo falada fica laranja `#F07C26`.**
- **Tamanho:** ~64 a 72 px em 1080×1920. Frases com só a primeira letra maiúscula, sem ponto final.
- **Blocos:** 2 a 4 palavras por vez, no máximo 2 linhas. Quebre nas pausas naturais da fala, nunca no meio de uma expressão ("Auxiliar de Serviços Gerais" fica inteiro num bloco; "36 horas semanais" também).
- **Posição:** centralizada, logo abaixo do queixo ou no terço inferior, **acima dos ~380 px de baixo** e fora dos ~140 px da direita. Nunca sobre o rosto.
- **Animação:** cada bloco entra com um leve subir e aparecer (0,15 s); a palavra ativa troca para laranja com um micro-scale de 1,0 para 1,06. Sem quique.
- **Palavras-chave** com destaque extra (só cor laranja fixa no bloco, sem outro efeito): `nosso time`, `vaga aberta`, `Auxiliar de Serviços Gerais`, `36 horas`, `comprometidos`, `WhatsApp`, `compartilhe`.
- **A legenda segue o que ela fala.** Como ela não fala o número, **o número não entra na legenda**. Ele aparece só no cartão do WhatsApp.
- **Quando houver um cartão, lista ou título na tela dizendo a mesma coisa**, esconda a legenda ou suba ela para não colidir. Principalmente com o **cartão do WhatsApp**, que nunca pode ficar coberto. Nunca dois textos brigando.
- **Ortografia:** confira contra o roteiro (acentos, "Serviços", "currículo", "seletivo", "Conservar"). A legenda segue o roteiro, não erros da transcrição.
- No **encerramento** a legenda some.
- Gere também um `.srt` da versão final, para eu usar se precisar.
