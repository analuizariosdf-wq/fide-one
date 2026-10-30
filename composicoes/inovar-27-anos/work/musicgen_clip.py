"""Um trecho de 30 s de trilha (MusicGen small, só texto). Uso: python3 -I musicgen_clip.py <saida.wav> <semente> <prompt>"""
import sys, numpy as np, soundfile as sf, torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration
torch.manual_seed(int(sys.argv[2])); torch.set_num_threads(8)
proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
sr = model.config.audio_encoder.sampling_rate
inp = proc(text=[sys.argv[3]], padding=True, return_tensors="pt")
with torch.no_grad():
    a = model.generate(**inp, do_sample=True, guidance_scale=3.5, max_new_tokens=int(30 * model.config.audio_encoder.frame_rate))[0, 0].numpy()
sf.write(sys.argv[1], a / (np.abs(a).max() + 1e-9) * 0.9, sr)
print("ok")
