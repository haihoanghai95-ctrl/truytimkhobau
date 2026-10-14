/**
 * Web Audio API synthesizer for playful, toddler-friendly preschool sound effects
 * Zero external asset dependency - works 100% offline with zero latency.
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isBgmPlaying = false;
  private sfxEnabled = true;
  private bgmEnabled = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (enabled && !this.isBgmPlaying) {
      this.startBgm();
    } else if (!enabled && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  /**
   * Cheerful bubble pop sound when clicking buttons or controls
   */
  public playPop() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio error safely ignored
    }
  }

  /**
   * Twinkle / search chime when magnifying glass moves across the picture
   */
  public playSearchTwinkle() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      const freq = 600 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Audio error safely ignored
    }
  }

  /**
   * Grand celebratory reveal fanfare when "HIỆN ĐÁP ÁN" is pressed
   */
  public playRevealFanfare() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Cheerful musical arpeggio: C5, E5, G5, C6 (523, 659, 783, 1046 Hz)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const durations = [0.1, 0.1, 0.12, 0.45];
      let offset = 0;

      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);

        const dur = durations[index];
        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + dur);

        offset += dur * 0.7;
      });

      // Add gentle harmonic bell sparkle
      setTimeout(() => {
        try {
          if (!this.ctx || !this.sfxEnabled) return;
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'triangle';
          const t2 = this.ctx.currentTime;
          osc2.frequency.setValueAtTime(1318.5, t2); // E6
          gain2.gain.setValueAtTime(0.15, t2);
          gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.4);
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.start(t2);
          osc2.stop(t2 + 0.4);
        } catch {}
      }, 300);
    } catch {
      // Audio error safely ignored
    }
  }

  /**
   * Cheerful slide / whoosh for next question
   */
  public playWhoosh() {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Gentle, soft toddler-appropriate nursery melody loop for BGM
   */
  public startBgm() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.initContext();

    const melodyNotes = [
      261.63, 293.66, 329.63, 261.63, // C4 D4 E4 C4
      329.63, 349.23, 392.00,        // E4 F4 G4
      392.00, 440.00, 392.00, 349.23, 329.63, 261.63 // G4 A4 G4 F4 E4 C4
    ];
    let noteIdx = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(melodyNotes[noteIdx % melodyNotes.length], now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);

        noteIdx++;
      } catch {}
    }, 450);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundEffects = new SoundEffectsEngine();
