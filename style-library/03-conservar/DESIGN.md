# Conservar — Design Spec

> Source of truth: `references/marca-logo-paleta.jpg` (official logo + palette)
> and the company's Instagram feed (@conservar_terceirizacao, seen in a
> screenshot the client shared; not committed because it shows people).
> Site: https://conservartc.com.br/

## Brand

Conservar Terceirização e Condomínios: outsourced building services for
companies and condominiums (portaria, limpeza, conservação, zeladoria).
Tagline in the bio: "Sua tranquilidade, nosso…". Tone is professional and
reassuring with a direct, slightly provocative hook ("O funcionário FALTOU.
E agora, síndico?", "Quanto a falta de limpeza está custando para a sua
empresa?"). The audience is síndicos, administradoras and business owners.

## Style Prompt

Clean corporate look on slate navy with one confident orange accent. Big,
heavy sans-serif headlines in white where the key words turn orange (or sit on
an orange highlight block). The orange swoosh from the logo appears as a
curved shape entering from a corner. Real people from the team (uniformed
staff, the speaker in the blue "Limpeza & Portaria" shirt) stay the hero;
graphics support them, never bury them. The logo signs off every video.

## Colors (official, from the palette sheet)

| Token | Hex | Use |
| --- | --- | --- |
| `--navy` | `#43506A` | backgrounds, text on light surfaces, wordmark |
| `--orange` | `#F07C26` | the ONE accent: highlighted words, swoosh, underline, CTA |
| `--gray` | `#C2C6CD` | dividers, secondary text on navy |
| `--white` | `#FFFFFF` | headline text on navy, light cards |

Orange is an accent, not a background for long text. One highlighted phrase
per card.

## Typography

- Display / headline: Montserrat 800–900, tight line-height (~1.0), sentence
  case. Approximation of the feed posts' bold geometric sans; replace when the
  official fonts arrive.
- Body / supporting: Montserrat 500–600.
- The logo wordmark is a rounded custom face: never re-type "CONSERVAR",
  always use the logo image.

## Logo

- `assets/logo-conservar.png`: colored (navy + orange), for white/light backgrounds.
- `assets/logo-conservar-branco.png`: white + orange, for navy or video backgrounds.
- Both were cut from the palette sheet JPG (≈980 px wide). Good for corners and
  end cards; ask for the SVG before using the logo full-screen large.

## Motion

- Entrance: slide + fade with `power3.out` / `--ease-out`, 0.4–0.6 s.
- Highlighted word: orange block wipes in left→right behind the word, or the
  word color fades white→orange.
- Swoosh: curved orange shape sweeps in from a corner on takeovers.
- Exit: quick fade/slide, 0.3 s. No spins, no heavy bounces.

## Card kinds in this style

- tier1: `thesis` (hook/statement with highlighted phrase), `stat`.
- tier2: `lower-third` (name + role), `list` (services, checklist with orange checks).
- Planned: end card with logo + CTA (site / WhatsApp), word-by-word captions
  in white with the active word in orange.

## What NOT to do

- Don't add colors outside the palette (no neon, no gradients to other hues).
- Don't cover the speaker's face; tier2 cards live in the lower third or a side.
- Don't distort, recolor or re-letter the logo.
- Don't set long paragraphs in orange or on orange.

## Vertical 9:16 (Reels / Shorts)

`vertical.css` holds the shared components; `cards/vertical/` holds standalone
1080x1920 cards (title, stack, list, highlight, thesis, end card). First used in
Roteiro 01 (Oct 2026).

- Safe area: text in x 90..940 and y 250..1540. The right ~140 px and bottom
  ~380 px belong to the Instagram UI. Cover text stays inside the 1080x1350
  grid crop (y 285..1635).
- Captions: Montserrat 800, 70 px, white with a navy-deep stroke, active word
  orange with a 1.06 micro-scale, bottom edge at y 1500. Hide them while an
  on-screen title or list says the same words.
- Lower-third text over the speaker gets the `.cv-scrim` navy gradient; orange
  text on a blue shirt does not read without it.
- Problems (pile of tasks) use a gray "!" icon; only solutions get orange checks.
- One orange accent per screen: chips/tags stay navy when a block or orange
  phrase is on screen.
- Fonts are bundled in `assets/fonts/` (Montserrat, OFL) so renders don't need the network.
- Rendering note: a frame that is fully opaque (takeover) is saved by Chromium
  as RGB, not RGBA. Convert every overlay frame to RGBA before compositing, or
  FFmpeg loses transparency for the rest of the sequence.
- Recruitment (Roteiro 02, vaga ASG): `v-whatsapp` (contact card), `v-info` (job
  conditions) and `v-share` (share CTA). Phone numbers are typed exactly from the
  brief and checked digit by digit in the encoded video; keep a number on screen
  >= 5 s in total. The WhatsApp glyph is `assets/icons/whatsapp-branco.svg`
  (Simple Icons, white only, never WhatsApp green).
