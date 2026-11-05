// Web Audio API procedural sound synthesizer for "The System"
// Generates sci-fi anime sound effects without any external audio asset dependencies.

export type SoundEffectType =
  | "level-up"
  | "rank-up"
  | "quest-complete"
  | "achievement"
  | "timer-start"
  | "timer-pause"
  | "timer-resume"
  | "timer-complete"
  | "timer-break"
  | "ui-click";

let sharedAudioCtx: AudioContext | null = null;
let soundEnabled = true;

/**
 * Configure whether System sound effects are played.
 */
export function setGlobalSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isGlobalSoundEnabled(): boolean {
  return soundEnabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtxClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtxClass();
    }

    if (sharedAudioCtx.state === "suspended") {
      void sharedAudioCtx.resume();
    }

    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a procedural System sound effect.
 * If force is true, bypasses the soundEnabled flag (useful for setting test previews).
 */
export function playSystemSound(type: SoundEffectType, options?: { force?: boolean }) {
  if (!soundEnabled && !options?.force) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    switch (type) {
      case "quest-complete":
        playQuestCompleteSound(ctx, now);
        break;
      case "level-up":
        playLevelUpSound(ctx, now);
        break;
      case "rank-up":
        playRankUpSound(ctx, now);
        break;
      case "achievement":
        playAchievementSound(ctx, now);
        break;
      case "timer-start":
        playTimerStartSound(ctx, now);
        break;
      case "timer-pause":
        playTimerPauseSound(ctx, now);
        break;
      case "timer-resume":
        playTimerResumeSound(ctx, now);
        break;
      case "timer-complete":
        playTimerCompleteSound(ctx, now);
        break;
      case "timer-break":
        playTimerBreakSound(ctx, now);
        break;
      case "ui-click":
        playUiClickSound(ctx, now);
        break;
    }
  } catch {
    // Audio playback is non-fatal; ignore browser audio errors.
  }
}

/**
 * High-tech holographic chime for System Quest Completion.
 * Two bright rising crystal tones with high-frequency shimmer.
 */
function playQuestCompleteSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.18, now);

  const notes = [
    { freq: 880, start: 0, dur: 0.55 },      // A5
    { freq: 1318.51, start: 0.08, dur: 0.75 },// E6
    { freq: 1760, start: 0.16, dur: 0.9 },   // A6
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);

    // Overtone shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(freq * 2, now + start);

    shimmerGain.gain.setValueAtTime(0.0001, now + start);
    shimmerGain.gain.exponentialRampToValueAtTime(0.05, now + start + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur * 0.6);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);

    shimmer.start(now + start);
    shimmer.stop(now + start + dur * 0.6 + 0.05);
  });
}

/**
 * Ascending power surge + triumphant fanfare for Hunter Level Up.
 */
function playLevelUpSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.25, now);

  // 1. Sub-bass punch (Mana surge release)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = "sine";
  subOsc.frequency.setValueAtTime(130, now);
  subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

  subGain.gain.setValueAtTime(0.3, now);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  subOsc.connect(subGain);
  subGain.connect(masterGain);
  subOsc.start(now);
  subOsc.stop(now + 0.35);

  // 2. Rising energy sweep
  const sweepOsc = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  const sweepFilter = ctx.createBiquadFilter();

  sweepOsc.type = "sawtooth";
  sweepFilter.type = "lowpass";
  sweepFilter.frequency.setValueAtTime(400, now);
  sweepFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.3);

  sweepOsc.frequency.setValueAtTime(220, now);
  sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

  sweepGain.gain.setValueAtTime(0.0001, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  sweepOsc.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(masterGain);
  sweepOsc.start(now);
  sweepOsc.stop(now + 0.35);

  // 3. Triumphant major chord fanfare (C5, E5, G5, C6)
  const chordNotes = [
    { freq: 523.25, start: 0.12, dur: 0.8 },  // C5
    { freq: 659.25, start: 0.20, dur: 0.9 },  // E5
    { freq: 783.99, start: 0.28, dur: 1.1 },  // G5
    { freq: 1046.5, start: 0.36, dur: 1.4 },  // C6
  ];

  chordNotes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

/**
 * Majestic monarch awakening for Hunter Rank Up (E -> S Rank).
 * Deep sub-bass, mana resonance, and grand harmonic progression.
 */
function playRankUpSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.28, now);

  // 1. Deep seismic rumble
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = "triangle";
  subOsc.frequency.setValueAtTime(90, now);
  subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.8);

  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  subOsc.connect(subGain);
  subGain.connect(masterGain);
  subOsc.start(now);
  subOsc.stop(now + 1.25);

  // 2. Detuned mana drone (reverberant mystery)
  [-3, 3].forEach((detune) => {
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sawtooth";
    drone.frequency.setValueAtTime(146.83, now); // D3
    drone.detune.setValueAtTime(detune, now);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.exponentialRampToValueAtTime(0.08, now + 0.1);
    droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    drone.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(masterGain);

    drone.start(now);
    drone.stop(now + 1.45);
  });

  // 3. Majestic awakening chord (D major / Power fifths)
  const rankNotes = [
    { freq: 293.66, start: 0.15, dur: 1.5 }, // D4
    { freq: 440.0,  start: 0.28, dur: 1.6 }, // A4
    { freq: 587.33, start: 0.42, dur: 1.8 }, // D5
    { freq: 739.99, start: 0.56, dur: 2.0 }, // F#5
    { freq: 1174.66, start: 0.70, dur: 2.2 }, // D6
  ];

  rankNotes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

/**
 * Triumphant fanfare for unlocking an Achievement.
 */
function playAchievementSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.2, now);

  const notes = [
    { freq: 523.25, start: 0, dur: 0.2 },     // C5
    { freq: 659.25, start: 0.09, dur: 0.2 },  // E5
    { freq: 783.99, start: 0.18, dur: 0.25 }, // G5
    { freq: 1046.5, start: 0.27, dur: 0.9 },  // C6
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

/**
 * Dungeon Gate activation tone when focus session begins.
 */
function playTimerStartSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.16, now);

  // Power engage hum
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.22);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.3);

  // Confirmation high blip
  const blip = ctx.createOscillator();
  const blipGain = ctx.createGain();
  blip.type = "sine";
  blip.frequency.setValueAtTime(880, now + 0.18);
  blip.frequency.exponentialRampToValueAtTime(1320, now + 0.28);

  blipGain.gain.setValueAtTime(0.0001, now + 0.18);
  blipGain.gain.exponentialRampToValueAtTime(0.12, now + 0.20);
  blipGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  blip.connect(blipGain);
  blipGain.connect(masterGain);
  blip.start(now + 0.18);
  blip.stop(now + 0.5);
}

/**
 * Downward tone when pausing focus.
 */
function playTimerPauseSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(587.33, now);
  osc.frequency.exponentialRampToValueAtTime(392.0, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Upward tone when resuming focus.
 */
function playTimerResumeSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(392.0, now);
  osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * The iconic System Focus Completion chime.
 * Staggered 3-bell sequence with warm resonance.
 */
function playTimerCompleteSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.2, now);

  const notes = [
    { freq: 523.25, start: 0, dur: 1.2 },    // C5
    { freq: 783.99, start: 0.12, dur: 1.3 }, // G5
    { freq: 1046.5, start: 0.24, dur: 1.5 }, // C6
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

/**
 * Gentle soothing descending tone when entering rest break.
 */
function playTimerBreakSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.15, now);

  const notes = [
    { freq: 783.99, start: 0, dur: 0.6 },     // G5
    { freq: 659.25, start: 0.14, dur: 0.7 },  // E5
    { freq: 523.25, start: 0.28, dur: 0.9 },  // C5
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.15, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
  });
}

/**
 * Micro tactile click for crisp HUD button feedback.
 */
function playUiClickSound(ctx: AudioContext, now: AudioContext["currentTime"]) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.015);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.025);
}
