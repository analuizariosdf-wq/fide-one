#!/usr/bin/env python3
"""Local, free transcription with faster-whisper in ElevenLabs Scribe shape.

The video tools in this repo (Herk Edit Kit's cut-silences / cut-mistakes /
short-form-edit, and the video-use skill) read word-level transcripts in the
ElevenLabs Scribe format: {"words": [{"text", "start", "end", "type",
"speaker_id"}, ...]} with "spacing" entries between words. This script writes
that same shape, so those tools work without an ElevenLabs API key.

Usage:
  python3 scripts/transcribe-local.py <video-or-audio> [more files...] [options]

Options:
  --model NAME     faster-whisper model: tiny, base, small (default), medium, large-v3
  --language CODE  e.g. pt, en (default: auto-detect)
  --output PATH    output JSON (single input only). Default: <input-stem>.json next to the source
  --video-use      write to <source-dir>/edit/transcripts/<stem>.json, where video-use looks
  --force          overwrite an existing transcript

The first run of a model downloads it from huggingface.co.
"""
import argparse
import json
import sys
import time
from pathlib import Path


def to_scribe(segments, info, model_name: str) -> dict:
    words = []
    prev_end = None
    for seg in segments:
        for w in seg.words or []:
            text = w.word.strip()
            if not text:
                continue
            start, end = round(w.start, 3), round(w.end, 3)
            if prev_end is not None:
                words.append({"text": " ", "start": prev_end, "end": max(prev_end, start),
                              "type": "spacing", "speaker_id": "speaker_0"})
            words.append({"text": text, "start": start, "end": end, "type": "word",
                          "speaker_id": "speaker_0", "logprob": round(w.probability, 4)})
            prev_end = end
    text = "".join(w["text"] for w in words)
    return {
        "language_code": info.language,
        "language_probability": round(info.language_probability, 4),
        "text": text,
        "words": words,
        "audio_duration_secs": round(info.duration, 3),
        "transcriber": f"faster-whisper/{model_name}",
    }


def output_path(src: Path, args) -> Path:
    if args.output:
        return Path(args.output)
    if args.video_use:
        return src.parent / "edit" / "transcripts" / f"{src.stem}.json"
    return src.with_suffix(".json")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("inputs", nargs="+")
    p.add_argument("--model", default="small")
    p.add_argument("--language")
    p.add_argument("--output")
    p.add_argument("--video-use", action="store_true")
    p.add_argument("--force", action="store_true")
    args = p.parse_args()

    if args.output and len(args.inputs) > 1:
        sys.exit("--output works with a single input only")

    from faster_whisper import WhisperModel

    model = None
    for raw in args.inputs:
        src = Path(raw)
        if not src.is_file():
            sys.exit(f"not found: {src}")
        out = output_path(src, args)
        if out.exists() and not args.force:
            print(f"cached: {out}")
            continue
        if model is None:
            model = WhisperModel(args.model, device="cpu", compute_type="int8")
        t0 = time.time()
        segments, info = model.transcribe(str(src), language=args.language,
                                          word_timestamps=True, vad_filter=True)
        payload = to_scribe(segments, info, args.model)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
        n = sum(1 for w in payload["words"] if w["type"] == "word")
        print(f"ok {time.time() - t0:.1f}s | {n} words | {payload['audio_duration_secs']:.1f}s audio "
              f"| {payload['language_code']} | {out}")


if __name__ == "__main__":
    main()
