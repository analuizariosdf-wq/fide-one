import sys, numpy as np, soundfile as sf, torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration
torch.manual_seed(int(sys.argv[2]) if len(sys.argv) > 2 else 7)
torch.set_num_threads(4)
proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
prompt = ("upbeat happy pop instrumental, bright and energetic, punchy four-on-the-floor kick and claps, "
          "funky bass, bright synth stabs and plucks, positive and fun, advertisement music, no vocals, 120 bpm")
inputs = proc(text=[prompt], padding=True, return_tensors="pt")
sr = model.config.audio_encoder.sampling_rate
tokens = int(29 * model.config.audio_encoder.frame_rate)
with torch.no_grad():
    audio = model.generate(**inputs, do_sample=True, guidance_scale=3.0, max_new_tokens=tokens)
sf.write(sys.argv[1], audio[0, 0].numpy(), sr)
print("ok", sr, audio.shape)
