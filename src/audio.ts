let audioCtx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let ambientTimer: ReturnType<typeof setInterval> | null = null;

export function ac(): AudioContext {
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio API not supported');
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function startAmbient(): void {
  try {
    const c = ac();
    if (c.state === 'suspended') void c.resume();
    if (ambientGain) return;
    ambientGain = c.createGain();
    ambientGain.gain.value = 0.04;
    ambientGain.connect(c.destination);
    const hum = c.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 55;
    const humG = c.createGain();
    humG.gain.value = 0.35;
    hum.connect(humG);
    humG.connect(ambientGain);
    hum.start();
    ambientTimer = setInterval(() => {
      if (Math.random() > 0.72) return;
      try {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'triangle';
        o.frequency.value = 880 + Math.random() * 440;
        g.gain.setValueAtTime(0.02, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
        o.connect(g);
        g.connect(ambientGain!);
        o.start();
        o.stop(c.currentTime + 0.09);
      } catch {
        /* ignore */
      }
    }, 2400);
  } catch {
    /* ignore */
  }
}

export function stopAmbient(): void {
  if (ambientTimer) clearInterval(ambientTimer);
  ambientTimer = null;
  if (ambientGain) {
    try {
      ambientGain.gain.exponentialRampToValueAtTime(0.001, ac().currentTime + 0.3);
    } catch {
      /* ignore */
    }
    ambientGain = null;
  }
}

export function playTick(u = 0): void {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = 200 + u * 480;
    g.gain.setValueAtTime(0.1 + u * 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.07);
  } catch {
    /* ignore */
  }
}

export function playSlotCollect(streak = 0): void {
  try {
    const c = ac();
    const base = 520 + Math.min(streak, 6) * 90;
    [0, 0.05, 0.1].forEach((d, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = i === 2 ? 'square' : 'sine';
      o.frequency.value = base + i * 180;
      g.gain.setValueAtTime(0.07, c.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.1);
      o.connect(g);
      g.connect(c.destination);
      o.start(c.currentTime + d);
      o.stop(c.currentTime + d + 0.12);
    });
  } catch {
    /* ignore */
  }
}

export function playCollect(): void {
  playSlotCollect(0);
}

export function playMine(): void {
  playMineExplosion(false);
}

/** Cartoon kaboom + slide whistle + rubber quack. */
export function playMineExplosion(big = true): void {
  try {
    const c = ac();
    const t0 = c.currentTime;

    const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.45), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (big ? 1800 : 2200));
    const s = c.createBufferSource();
    const g = c.createGain();
    s.buffer = b;
    g.gain.setValueAtTime(big ? 0.65 : 0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
    s.connect(g);
    g.connect(c.destination);
    s.start(t0);

    const boom = c.createOscillator();
    const boomG = c.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(big ? 90 : 110, t0);
    boom.frequency.exponentialRampToValueAtTime(28, t0 + 0.2);
    boomG.gain.setValueAtTime(big ? 0.55 : 0.35, t0);
    boomG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    boom.connect(boomG);
    boomG.connect(c.destination);
    boom.start(t0);
    boom.stop(t0 + 0.3);

    const whistle = c.createOscillator();
    const wG = c.createGain();
    whistle.type = 'triangle';
    whistle.frequency.setValueAtTime(big ? 1400 : 1100, t0 + 0.05);
    whistle.frequency.exponentialRampToValueAtTime(180, t0 + 0.45);
    wG.gain.setValueAtTime(0.12, t0 + 0.05);
    wG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
    whistle.connect(wG);
    wG.connect(c.destination);
    whistle.start(t0 + 0.05);
    whistle.stop(t0 + 0.5);

    const quack = c.createOscillator();
    const qG = c.createGain();
    quack.type = 'square';
    quack.frequency.setValueAtTime(380, t0 + 0.08);
    quack.frequency.exponentialRampToValueAtTime(220, t0 + 0.22);
    qG.gain.setValueAtTime(big ? 0.14 : 0.08, t0 + 0.08);
    qG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
    quack.connect(qG);
    qG.connect(c.destination);
    quack.start(t0 + 0.08);
    quack.stop(t0 + 0.28);
  } catch {
    /* ignore */
  }
}

export function playJingle(): void {
  try {
    const c = ac();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = c.currentTime + i * 0.13;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch {
    /* ignore */
  }
}

export function playJackpot(): void {
  try {
    const c = ac();
    [392, 494, 587, 784, 988, 1175].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = c.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + 0.38);
    });
  } catch {
    /* ignore */
  }
}

export function playCount(n: number): void {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = n === 1 ? 920 : 440 - n * 16;
    o.type = 'sawtooth';
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.35);
  } catch {
    /* ignore */
  }
}

export function playDeal(): void {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(300, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.15);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.22);
  } catch {
    /* ignore */
  }
}
