# Herk Edit Kit: workspace guide

Adapted from https://github.com/nateherkai/hyperframes-student-kit (MIT, see
`licenses/herk-edit-kit/`). Only the skills, scripts, style library and small
examples were copied; the showcase videos and teaching projects were left out,
so references to `video-projects/<example>` or `README.md` point to the upstream repo.
The `hyperframes`, `hyperframes-cli` and `hyperframes-registry` skills come from the
official heygen-com/hyperframes install, not the kit. The kit's legacy
`short-form-video` skill (May Shorts examples) was replaced by the iart-ai
`short-form-video` skill from iart-ai/tiktok-video-skills (MIT).

## Toolchain in this repo (read first)

Every installed tool serves video editing. Combine them this way. This section
overrides the provider defaults further down (ElevenLabs is not the default here):

| Stage | Default | Alternatives / notes |
| --- | --- | --- |
| Get footage | Files the user uploads, or a Google Drive link: `gdown --folder "<link>" -O video-projects/<slug>/raw/` (`gdown "<link>" -O <path>` for one file) | `yt-dlp` (YouTube blocks cloud IPs; works on the user's machine) |
| Transcribe | `python3 scripts/transcribe-local.py <file> --language pt` (faster-whisper, free, Scribe-shaped JSON next to the source) | ElevenLabs (`npm run transcribe`, video-use `transcribe.py`) only if the user asks and has a key |
| Cut silences / mistakes | `/cut-silences` then `/cut-mistakes` (kit) | video-use cuts from its EDL |
| Full edit of a recording | `/edit-video` (long form) or `/short-form-edit` (reels/Shorts) | `/video-use` when the user asks for it, for multi-take montages, or color grading |
| Motion graphics / compositions | HyperFrames (`/hyperframes`, kit styles, `/gsap`) | Remotion (`remotion/`, `/remotion-*`) only when the user asks for React/Remotion |
| Short-form craft | `/short-form-video` (hooks, retention), `/caption-animation`, `/lower-thirds`, `/countdown-video` | |
| Audio, music, SFX, voice | `/hyperframes-audio`, `/media-use` | |
| Verify output | `bash scripts/probe-mp4.sh out.mp4 1080x1920 30`, video-use `timeline_view.py` | |

- Transcripts: for the kit, keep the default output (`<stem>.json` next to the
  source). For video-use, add `--video-use` (writes `<dir>/edit/transcripts/<stem>.json`)
  and then run `pack_transcripts.py --edit-dir <dir>/edit` directly; skip video-use's
  `transcribe.py`/`transcribe_batch.py`, which demand an ElevenLabs key even when cached.
  Use `--model small` or `medium` for Portuguese; `tiny` only for quick tests.
- ffmpeg: the kit's cut scripts need ffmpeg 7 (`-/filter_complex`). The
  session-start hook puts `node_modules/ffmpeg-static/ffmpeg` (7.x) first on PATH;
  if `ffmpeg -version` shows 6.x, run `export PATH="$PWD/.cache/bin:$PATH"` after
  `ln -sf "$PWD/node_modules/ffmpeg-static/ffmpeg" .cache/bin/ffmpeg`.
- Remotion renders in the cloud need
  `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
  Remotion requires a paid company license for companies with more than 3 people.
- Google Drive: the folder or file must be shared as "Anyone with the link"
  (viewer), and the environment's allowed domains need `drive.google.com`,
  `*.googleusercontent.com` and `drive.usercontent.google.com`. A 403 from the
  proxy means a domain is missing; a gdown permission error means the sharing
  is not public. If a large folder comes back incomplete, download its
  subfolders or single-file links. The user's Drive folders usually
  hold the raw video(s), the cover photo and the script (roteiro): read the
  script first and use it to plan the edit and captions.
- Keep footage and renders under `video-projects/<slug>/` (gitignored).

Turn a talking-head recording into an intentional edit using local HyperFrames
rendering, transcript-driven cuts, and reusable motion graphics.

## Start and route

Read `README.md` for installation and `docs/WORKFLOW.md` for a complete edit.
Use `edit-video` to coordinate transcription, cuts, design, and verification.
For one stage, load the matching local skill:

| Need | Skill |
| --- | --- |
| Reels, Shorts, and short advertisements | `short-form-edit` |
| Motion-design showreels and brand reels cut to music | `motion-showreel` |
| Hooks, retention pacing and loops for TikTok/Reels/Shorts (iart-ai pack) | `short-form-video` |
| Word-timed karaoke captions | `caption-animation` |
| Countdown timers | `countdown-video` |
| Animated lower thirds | `lower-thirds` |
| Conversational edit of any footage with color grade and burned subtitles (browser-use/video-use; transcription needs ELEVENLABS_API_KEY) | `video-use` |
| New motion-graphics video from a brief | `make-a-video` |
| Website-inspired compositions | `website-to-hyperframes` |
| Full raw-video edit | `edit-video` |
| Silence removal | `cut-silences` |
| Retakes, false starts, or stutters | `cut-mistakes` |
| Narrative arc, persistent world, and visual callbacks | `video-storytelling` |
| Overlay beats, paper takeovers, and glass cards | `hyperframes-video-beats` |
| Select or extend styles and templates | `style-library` |
| HTML compositions and media timing | `hyperframes` |
| Preview, lint, and rendering | `hyperframes-cli` |
| Timeline animation | `gsap` |
| Install HyperFrames catalog blocks | `hyperframes-registry` |

Before a creative session read `MOTION_PHILOSOPHY.md` and the project's DESIGN.md.
The philosophy's fast sizzle pacing is a style reference. Give educational speech
room to breathe. The project brief controls pacing, palette, and typography.
Framework skill contracts override historical code recipes in the style guide.

## Workspace

Create a project with `npm run new-video -- my-video`. Keep source media, EDLs,
transcripts, compositions, and renders together under `video-projects/<slug>/`.
Run HyperFrames from that project's directory. The root `scripts/` utilities
accept paths from the working directory. `style-library/registry.json` indexes
cards; each style has a DESIGN.md, CSS tokens, and named text slots.
See `style-templates/README.md` for whole-scene templates.

Preserve raw files. Use a new output filename for each editing stage. Archive
obsolete work. Video projects, personal footage, transcripts, credentials, and
renders are gitignored. The 12 already-published projects are retained as teaching examples; new private
projects stay ignored. Do not treat existing public examples as permission to add
new personal footage. Never print secrets or copy private media into library examples.

## Editing and timing

Before choosing a transcription, asset-generation, or voiceover service, read
`docs/TOOLS-AND-API-KEYS.md` and check the user's provider choice and local setup.
ElevenLabs Scribe is Nate's default; honor requests for OpenAI Whisper, local
Whisper, or another provider. Normalize verified word timestamps for the cutting
tools. The included transcription script is ElevenLabs-only. Kie.ai is optional
and needs a configured integration and credits. Reuse existing transcripts and
assets; make any unapproved uploads or paid calls concrete before asking.

Cut silences first; use its edited video AND retimed transcript for cut-mistakes.
Review each mistake in context. Intentional repetition is not a mistake. Record
the reviewed decisions before applying them. If no cuts are needed, preserve the
input or use an empty cuts list. Never mix original timestamps with edited footage.

Load the relevant skills before changing HTML. Root compositions use a visible
div with id, data-composition-id, data-start, duration, width, and height. Timed
elements carry data-start, data-duration, and data-track-index; same-track clips
must not overlap. Visible timed divs use class="clip"; videos do not.
Mute videos and use sibling audio for the mix. Animate a non-timed video wrapper.
Register one synchronous paused GSAP timeline per composition in window.__timelines
using its exact composition ID. Keep finite timelines and explicit durations.
HyperFrames owns media playback. Use deterministic animation and local assets.

## Verification and approvals

Run `node scripts/preflight.mjs <project>` and HyperFrames lint. For anchored
sub-compositions, run `node scripts/validate-beat-sync.mjs <project>`; each beat
needs data-anchor with an exact transcript phrase. Enter between 0.2 seconds after
and 1.8 seconds before that word. Inline timelines require manual timing review.

Review Studio before draft rendering. Review the encoded draft, extract and
inspect hero frames and transition boundaries, and listen to the audio joins.
Check cropped faces, overflow, black flashes, readable labels, clipping, and A/V
sync. Resolve problems before the final render. Save evidence in VERIFY.md.
Use a Range-capable preview server for MP4 scrubbing (for example `npx serve`).

Honor approvals already provided. When review approval is missing, prepare the
concrete preview or cut proposal first. Never claim a lint result proves visual
quality. Only publish or upload a finished video when the user authorizes it.
Automated browser checks must be headless, with Pointer Lock and cursor capture
disabled; synthetic input must remain inside the virtual browser.

For short-form edits, read `docs/SHORT-FORM.md` and `docs/EDITING-PLAYBOOK.md`
(Nate's measured house style and lessons), and use the plan and footage
validators. Structural checks supplement rendered video and audio review.
