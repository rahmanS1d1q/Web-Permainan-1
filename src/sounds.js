import { MUTE_KEY } from "./constants.js";

let _muted = localStorage.getItem(MUTE_KEY) === "1";
export function setMuted(v) {
  _muted = v;
  localStorage.setItem(MUTE_KEY, v ? "1" : "0");
}
export function getMuted() {
  return _muted;
}

const AudioCtx =
  typeof window !== "undefined" &&
  (window.AudioContext || window.webkitAudioContext);
let _ctx = null;
function getCtx() {
  if (!_ctx && AudioCtx) _ctx = new AudioCtx();
  return _ctx;
}

function playTone(freq, type = "sine", duration = 0.12, vol = 0.18, delay = 0) {
  if (_muted) return;
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch {}
}

// ── Noise buffer (untuk suara mekanik) ────────────────────────────────────────
function makeNoiseBuffer(ctx, duration = 0.05) {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(sr * duration), sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playNoise(vol = 0.15, duration = 0.04, delay = 0, highpass = 800) {
  if (_muted) return;
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const buf = makeNoiseBuffer(ctx, duration + 0.01);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    // highpass filter — suara klik mekanik
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highpass;
    const gain = ctx.createGain();
    src.connect(hp);
    hp.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.start(t);
    src.stop(t + duration + 0.01);
  } catch {}
}

// ── Slot Machine spin sound ────────────────────────────────────────────────────
// Menyimpan referensi interval agar bisa dihentikan
let _slotSpinInterval = null;
let _slotSpinNodes = [];

function stopSlotSpin() {
  if (_slotSpinInterval) {
    clearInterval(_slotSpinInterval);
    _slotSpinInterval = null;
  }
  _slotSpinNodes.forEach((n) => {
    try {
      n.stop();
    } catch {}
  });
  _slotSpinNodes = [];
}

function startSlotSpin() {
  if (_muted) return;
  stopSlotSpin();
  try {
    const ctx = getCtx();
    if (!ctx) return;

    // Suara reel berputar — noise broadband dengan filter yang berubah
    // Mirip suara mekanik reel slot machine asli
    let tick = 0;
    const totalDuration = 1.8; // detik total spin
    const startTime = ctx.currentTime;

    // Layer 1: suara reel berputar (noise + bandpass bergerak)
    const spinNoise = () => {
      if (_muted) return;
      const elapsed = ctx.currentTime - startTime;
      if (elapsed > totalDuration) return;

      // Kecepatan tick makin lambat seiring waktu (deceleration)
      const progress = elapsed / totalDuration;
      const tickRate = 0.04 + progress * 0.12; // makin lambat

      // Klik mekanik reel
      playNoise(0.12 - progress * 0.06, 0.025, 0, 1200 + progress * 800);

      // Tone pendek seperti reel klik
      const freq = 180 + Math.random() * 40;
      playTone(freq, "square", 0.02, 0.08 - progress * 0.04);

      _slotSpinInterval = setTimeout(spinNoise, tickRate * 1000);
    };

    spinNoise();

    // Layer 2: suara motor/hum latar belakang saat spin
    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.connect(humGain);
    humGain.connect(ctx.destination);
    humOsc.type = "sawtooth";
    humOsc.frequency.setValueAtTime(60, ctx.currentTime);
    humOsc.frequency.linearRampToValueAtTime(
      40,
      ctx.currentTime + totalDuration,
    );
    humGain.gain.setValueAtTime(0.06, ctx.currentTime);
    humGain.gain.linearRampToValueAtTime(
      0.02,
      ctx.currentTime + totalDuration * 0.7,
    );
    humGain.gain.linearRampToValueAtTime(0, ctx.currentTime + totalDuration);
    humOsc.start(ctx.currentTime);
    humOsc.stop(ctx.currentTime + totalDuration);
    _slotSpinNodes.push(humOsc);
  } catch {}
}

function playSlotStop(reelIndex) {
  // Suara "klik" saat setiap reel berhenti — berbeda per reel
  if (_muted) return;
  const baseFreq = [220, 200, 180][reelIndex] ?? 200;
  // Klik keras
  playNoise(0.25, 0.035, 0, 600);
  // Tone pendek
  playTone(baseFreq, "square", 0.06, 0.15);
  playTone(baseFreq * 1.5, "sine", 0.04, 0.08, 0.02);
}

function playSlotWin() {
  // Suara koin jatuh + jingle
  if (_muted) return;
  // Koin jatuh — beberapa noise burst
  for (let i = 0; i < 8; i++) {
    playNoise(0.18, 0.03, i * 0.06, 2000 + Math.random() * 1000);
    playTone(800 + Math.random() * 400, "sine", 0.04, 0.12, i * 0.06 + 0.01);
  }
  // Jingle atas
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    playTone(f, "triangle", 0.18, 0.25, 0.3 + i * 0.09),
  );
}

function playSlotJackpot() {
  if (_muted) return;
  // Koin banyak jatuh
  for (let i = 0; i < 20; i++) {
    playNoise(0.2, 0.03, i * 0.04, 1800 + Math.random() * 1200);
    playTone(700 + Math.random() * 500, "sine", 0.05, 0.15, i * 0.04 + 0.01);
  }
  // Fanfare
  [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
    playTone(f, "triangle", 0.25, 0.35, 0.5 + i * 0.08),
  );
}

export const SFX = {
  // Slot machine sounds — lebih realistis
  slotSpinStart: startSlotSpin,
  slotSpinStop: stopSlotSpin,
  slotReelStop: playSlotStop,
  slotWin: playSlotWin,
  slotJackpot: playSlotJackpot,

  // Generic spin (untuk game lain)
  spin: () => {
    playTone(220, "sawtooth", 0.08, 0.1);
    playTone(180, "sawtooth", 0.08, 0.08, 0.05);
  },
  click: () => playTone(600, "sine", 0.05, 0.1),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      playTone(f, "sine", 0.15, 0.2, i * 0.1),
    );
  },
  bigwin: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      playTone(f, "triangle", 0.2, 0.3, i * 0.08),
    );
  },
  lose: () => {
    playTone(200, "sawtooth", 0.15, 0.15);
    playTone(150, "sawtooth", 0.15, 0.12, 0.1);
  },
  flip: () => {
    for (let i = 0; i < 6; i++)
      playTone(300 + i * 80, "sine", 0.06, 0.1, i * 0.05);
  },
  deal: () => playTone(800, "sine", 0.06, 0.12),
  crash: () => {
    playTone(400, "sawtooth", 0.3, 0.3);
    playTone(200, "sawtooth", 0.3, 0.2, 0.1);
  },
  cashout: () => {
    [400, 600, 800].forEach((f, i) => playTone(f, "sine", 0.1, 0.2, i * 0.06));
  },
  roulette: () => {
    for (let i = 0; i < 8; i++)
      playTone(200 + i * 30, "sine", 0.08, 0.08, i * 0.12);
  },
  plinko: () => playTone(500 + Math.random() * 300, "sine", 0.05, 0.12),
  bonus: () => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      playTone(f, "sine", 0.2, 0.25, i * 0.07),
    );
  },
  achieve: () => {
    [800, 1000, 1200, 1000, 800].forEach((f, i) =>
      playTone(f, "triangle", 0.1, 0.25, i * 0.06),
    );
  },
  levelup: () => {
    [400, 500, 600, 800, 1000].forEach((f, i) =>
      playTone(f, "sine", 0.18, 0.3, i * 0.07),
    );
  },
  swipe: () => playTone(440, "sine", 0.08, 0.12),
};

// ── Roulette sounds ────────────────────────────────────────────────────────────
let _rouletteBallInterval = null;

function stopRouletteBall() {
  if (_rouletteBallInterval) {
    clearInterval(_rouletteBallInterval);
    _rouletteBallInterval = null;
  }
}

// Bola berputar di roda — rolling + klik-klik makin lambat
export function rouletteSpinStart(durationMs = 4000) {
  if (_muted) return;
  stopRouletteBall();
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const start = ctx.currentTime;
    const totalSec = durationMs / 1000;
    let elapsed = 0;

    // Hum roda berputar
    const wheelOsc = ctx.createOscillator();
    const wheelGain = ctx.createGain();
    wheelOsc.connect(wheelGain);
    wheelGain.connect(ctx.destination);
    wheelOsc.type = "sawtooth";
    wheelOsc.frequency.setValueAtTime(80, start);
    wheelOsc.frequency.linearRampToValueAtTime(40, start + totalSec * 0.8);
    wheelOsc.frequency.linearRampToValueAtTime(20, start + totalSec);
    wheelGain.gain.setValueAtTime(0.04, start);
    wheelGain.gain.linearRampToValueAtTime(0.01, start + totalSec);
    wheelOsc.start(start);
    wheelOsc.stop(start + totalSec);

    // Bola rolling — klik-klik makin lambat
    const tick = () => {
      if (_muted) return;
      elapsed += 0.001;
      const progress = Math.min(elapsed / totalSec, 1);
      const freq = 1800 - progress * 1200;
      playNoise(0.18 - progress * 0.1, 0.018, 0, freq);
      playTone(freq * 0.5, "sine", 0.015, 0.1 - progress * 0.06);
      const nextInterval = 60 + progress * 280;
      if (progress < 0.95) {
        _rouletteBallInterval = setTimeout(tick, nextInterval);
      }
    };
    _rouletteBallInterval = setTimeout(tick, 60);
  } catch {}
}

// Bola jatuh ke pocket — "clack" keras + memantul
export function rouletteBallDrop() {
  if (_muted) return;
  stopRouletteBall();
  try {
    for (let i = 0; i < 4; i++) {
      playNoise(0.35 - i * 0.07, 0.03, i * 0.08, 800 + i * 200);
      playTone(300 - i * 40, "square", 0.04, 0.2 - i * 0.04, i * 0.08 + 0.01);
    }
    playNoise(0.15, 0.06, 0.35, 400);
    playTone(120, "sine", 0.12, 0.1, 0.36);
  } catch {}
}

// Menang di roulette — koin + jingle
export function rouletteWin() {
  if (_muted) return;
  for (let i = 0; i < 6; i++) {
    playNoise(0.15, 0.025, i * 0.07, 1800 + Math.random() * 800);
    playTone(700 + Math.random() * 300, "sine", 0.04, 0.12, i * 0.07 + 0.01);
  }
  [523, 659, 784, 1047].forEach((f, i) =>
    playTone(f, "sine", 0.15, 0.2, 0.35 + i * 0.09),
  );
}

// Kalah di roulette
export function rouletteLose() {
  if (_muted) return;
  playTone(200, "sawtooth", 0.2, 0.15);
  playTone(140, "sawtooth", 0.2, 0.12, 0.12);
  playNoise(0.08, 0.1, 0.05, 200);
}
