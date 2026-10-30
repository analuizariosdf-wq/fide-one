"""Trilha de reserva (MusicGen small) caso a musica.mp3 não chegue: piano que cresce até orquestra.
Uso: python3 -I musicgen.py <saida.wav> <semente>
Gera ~96 s em 5 partes; cada parte continua os últimos 8 s da anterior (mesma tonalidade e andamento)."""
import sys, numpy as np, soundfile as sf, torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration
torch.manual_seed(int(sys.argv[2])); torch.set_num_threads(8)
proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
sr = model.config.audio_encoder.sampling_rate; fr = model.config.audio_encoder.frame_rate
base = "emotional inspiring cinematic instrumental, warm grand piano, major key, 76 bpm, no vocals, no drums at start, "
parts = [
    (base + "solo soft gentle piano, intimate, delicate, hopeful", 28),
    (base + "piano with soft warm strings pad entering, hopeful, gentle", 22),
    (base + "piano and lush strings, growing, heartfelt, uplifting", 22),
    (base + "full orchestra, soaring strings, piano, soft timpani, emotional climax, triumphant and warm", 22),
    (base + "orchestra resolving gently, final piano chord, warm ending", 16),
]
out = None
for prompt, secs in parts:
    if out is None:
        inp = proc(text=[prompt], padding=True, return_tensors="pt")
        with torch.no_grad():
            a = model.generate(**inp, do_sample=True, guidance_scale=3.0, max_new_tokens=int(secs * fr))[0, 0].numpy()
        out = a
    else:
        ctx = out[-8 * sr:]
        inp = proc(audio=ctx, sampling_rate=sr, text=[prompt], padding=True, return_tensors="pt")
        with torch.no_grad():
            a = model.generate(**inp, do_sample=True, guidance_scale=3.0, max_new_tokens=int((secs + 8) * fr))[0, 0].numpy()
        new = a[len(ctx):]
        out = np.concatenate([out, new])
    print("parte ok", len(out) / sr, flush=True)
sf.write(sys.argv[1], out / (np.abs(out).max() + 1e-9) * 0.9, sr)
print("ok", len(out) / sr)
