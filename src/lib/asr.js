// src/lib/asr.js
//
// Upgrades:
// - Use a more accurate model by default: 'Xenova/whisper-base.en' (vs tiny)
// - Longer chunk with overlap for better context
// - Optional .env override via VITE_ASR_MODEL
//
// NOTE: first run will download the model (~140MB for base), then cached.

import { pipeline } from '@xenova/transformers';

let _pipe;

/** Load (or reuse) the ASR pipeline */
async function getPipeline() {
  if (_pipe) return _pipe;

  // Allow override via .env, otherwise use the better default.
  const MODEL_ID =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_ASR_MODEL) ||
    'Xenova/whisper-base.en';

  _pipe = await pipeline('automatic-speech-recognition', MODEL_ID);
  return _pipe;
}

/** Transcribe an audio Blob -> string */
export async function transcribe(blob) {
  // Keep the same input contract as your existing app: pass the Blob through.
  // If your recorder already emits PCM Float32 blobs this will work as-is.
  // (For most recorders using MediaRecorder/webm, Transformers.js can still
  // read TypedArray/ArrayBuffer; we preserve your current approach.)
  const arrayBuffer = await blob.arrayBuffer();
  const float32 = new Float32Array(arrayBuffer);

  const pipe = await getPipeline();
  const out = await pipe(float32, {
    // Give the model more context than before
    chunk_length_s: 30,   // was 15
    stride_length_s: 5,   // keep overlap to avoid word cuts
    return_timestamps: false,
  });

  return (out && out.text) ? out.text.trim() : '';
}
