let audioContext = null;
let noiseBuffer = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function getNoiseBuffer(context) {
  if (!context) return null;

  if (!noiseBuffer || noiseBuffer.sampleRate !== context.sampleRate) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseBuffer = buffer;
  }

  return noiseBuffer;
}

function createEnvelope(context, startTime, peakVolume, attack, decay) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakVolume, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);
  gain.connect(context.destination);
  return gain;
}

function playTone({
  type = "sine",
  frequency,
  frequencyEnd = frequency,
  startTime,
  attack = 0.01,
  decay = 0.18,
  volume = 0.08,
}) {
  const context = getAudioContext();
  if (!context) return;

  const gain = createEnvelope(context, startTime, volume, attack, decay);
  const oscillator = context.createOscillator();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(40, frequencyEnd),
    startTime + attack + decay
  );

  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + attack + decay + 0.05);
}

export function primeGameAudio() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }
}

export function playTurnAlertSound() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime + 0.01;

  playTone({
    type: "sine",
    frequency: 660,
    frequencyEnd: 760,
    startTime: now,
    attack: 0.01,
    decay: 0.16,
    volume: 0.05,
  });

  playTone({
    type: "sine",
    frequency: 880,
    frequencyEnd: 980,
    startTime: now + 0.14,
    attack: 0.01,
    decay: 0.18,
    volume: 0.05,
  });

  playTone({
    type: "triangle",
    frequency: 1175,
    frequencyEnd: 1319,
    startTime: now + 0.3,
    attack: 0.01,
    decay: 0.26,
    volume: 0.045,
  });
}

export function playCoinFlipSound() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime + 0.01;

  playTone({
    type: "square",
    frequency: 1280,
    frequencyEnd: 1860,
    startTime: now,
    attack: 0.004,
    decay: 0.1,
    volume: 0.035,
  });

  playTone({
    type: "triangle",
    frequency: 1660,
    frequencyEnd: 980,
    startTime: now + 0.06,
    attack: 0.004,
    decay: 0.16,
    volume: 0.03,
  });
}

export function playDiceRollSound() {
  const context = getAudioContext();
  if (!context) return;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const now = context.currentTime + 0.01;
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);

  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(720, now);
  filter.frequency.exponentialRampToValueAtTime(180, now + 0.45);
  filter.Q.value = 0.9;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.03, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  noise.start(now);
  noise.stop(now + 0.5);

  playTone({
    type: "triangle",
    frequency: 210,
    frequencyEnd: 90,
    startTime: now,
    attack: 0.01,
    decay: 0.34,
    volume: 0.025,
  });

  playTone({
    type: "square",
    frequency: 360,
    frequencyEnd: 220,
    startTime: now + 0.11,
    attack: 0.005,
    decay: 0.1,
    volume: 0.01,
  });
}
