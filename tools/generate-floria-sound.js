// Floria — Distinctive Botanical Notification Sound Generator
// Generates a clean, warm, organic chime in standard 16-bit 44.1kHz PCM WAV format.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleRate = 44100;
const durationSec = 0.85;
const numSamples = Math.floor(sampleRate * durationSec);

// Notes in chord: E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.51)
const notes = [
  { freq: 659.25, gain: 0.35, decay: 4.5, delay: 0.0 },     // Root E5
  { freq: 830.61, gain: 0.28, decay: 5.2, delay: 0.04 },    // Major 3rd G#5
  { freq: 987.77, gain: 0.22, decay: 6.0, delay: 0.08 },    // 5th B5
  { freq: 1318.51, gain: 0.18, decay: 7.0, delay: 0.12 },   // Octave chime E6
];

const samples = new Float32Array(numSamples);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  let sample = 0;

  for (const note of notes) {
    if (t >= note.delay) {
      const noteT = t - note.delay;
      // Soft organic attack (12ms) + natural exponential decay
      const attack = Math.min(1.0, noteT / 0.012);
      const envelope = attack * Math.exp(-note.decay * noteT);
      // Sine wave with subtle 2nd harmonic warmth
      const fundamental = Math.sin(2 * Math.PI * note.freq * noteT);
      const overtone = 0.15 * Math.sin(2 * Math.PI * (note.freq * 2) * noteT);
      sample += note.gain * envelope * (fundamental + overtone);
    }
  }

  // Smooth final fade-out
  const fadeOut = t > (durationSec - 0.05) ? (durationSec - t) / 0.05 : 1.0;
  samples[i] = sample * fadeOut;
}

// Convert Float32 to 16-bit PCM Buffer
const bytesPerSample = 2;
const pcmBuffer = Buffer.alloc(numSamples * bytesPerSample);
for (let i = 0; i < numSamples; i++) {
  const s = Math.max(-1, Math.min(1, samples[i]));
  const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
  pcmBuffer.writeInt16LE(Math.floor(int16), i * bytesPerSample);
}

// Construct standard 44-byte WAV header
const wavHeader = Buffer.alloc(44);
const dataSize = pcmBuffer.length;
const fileSize = dataSize + 36;

wavHeader.write("RIFF", 0);
wavHeader.writeUInt32LE(fileSize, 4);
wavHeader.write("WAVE", 8);
wavHeader.write("fmt ", 12);
wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
wavHeader.writeUInt16LE(1, 22);  // NumChannels (1 for Mono)
wavHeader.writeUInt32LE(sampleRate, 24); // SampleRate
wavHeader.writeUInt32LE(sampleRate * bytesPerSample, 28); // ByteRate
wavHeader.writeUInt16LE(bytesPerSample, 32); // BlockAlign
wavHeader.writeUInt16LE(16, 34); // BitsPerSample
wavHeader.write("data", 36);
wavHeader.writeUInt32LE(dataSize, 40);

const finalWav = Buffer.concat([wavHeader, pcmBuffer]);

const targetDirs = [
  path.resolve(__dirname, "../apps/customer-mobile/assets/sounds"),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, "floria_chime.wav");
  fs.writeFileSync(filePath, finalWav);
  console.log(`Generated Floria sound asset: ${filePath} (${finalWav.length} bytes)`);
}
