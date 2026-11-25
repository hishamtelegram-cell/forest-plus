'use client';

class BotanicalSoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private activeSourceNodes: AudioNode[] = [];
  private currentMode: 'none' | 'rain' | 'wind' | 'stream' | 'night' = 'none';
  private intervalId: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playCompletionChime(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Warm pentatonic botanical chord (C5, E5, G5, B5, D6)
    const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.09 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 1.45);
    });
  }

  public playClickPop(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.06);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public setAmbientSound(mode: 'none' | 'rain' | 'wind' | 'stream' | 'night', soundEnabled: boolean = true) {
    if (!soundEnabled || mode === 'none') {
      this.stopAmbient();
      return;
    }
    if (this.currentMode === mode && this.activeSourceNodes.length > 0) {
      return;
    }
    this.stopAmbient();
    this.currentMode = mode;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.ambientGain = masterGain;

    // Create pink/brown noise buffer for organic nature soundscapes
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 2.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    if (mode === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 950;
      filter.Q.value = 0.7;
    } else if (mode === 'wind') {
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      filter.Q.value = 2.5;
    } else if (mode === 'stream') {
      filter.type = 'bandpass';
      filter.frequency.value = 520;
      filter.Q.value = 1.2;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 240;
    }

    noise.connect(filter);
    filter.connect(masterGain);
    noise.start();
    this.activeSourceNodes.push(noise, filter);

    if (mode === 'night') {
      // Gentle evening cricket harmonic chirps
      this.intervalId = window.setInterval(() => {
        if (!this.ctx || !this.ambientGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3800, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.012, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(g);
        g.connect(this.ambientGain);
        osc.start(now);
        osc.stop(now + 0.15);
      }, 1800);
    }
  }

  public stopAmbient() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeSourceNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as AudioBufferSourceNode).stop === 'function') {
          (node as AudioBufferSourceNode).stop();
        }
        node.disconnect();
      } catch {}
    });
    this.activeSourceNodes = [];
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {}
      this.ambientGain = null;
    }
    this.currentMode = 'none';
  }
}

export const soundEngine = new BotanicalSoundEngine();
