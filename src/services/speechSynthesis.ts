/**
 * Comprehensive Vietnamese Speech & Audio Service
 * Combines built-in toddler-friendly native Vietnamese audio clips (100% offline & cross-device)
 * with HTML5 Audio and Web Speech API fallback.
 */

import { BUILTIN_VIETNAMESE_AUDIO } from './builtInAudios';

export interface SpeechStatus {
  isSupported: boolean;
  hasVietnameseVoice: boolean;
  voiceName?: string;
  availableVoices: SpeechSynthesisVoice[];
}

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private isUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }

      // Pre-warm audio on initial user touch or click
      const unlockHandler = () => {
        this.unlock();
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('click', unlockHandler);
      };
      window.addEventListener('pointerdown', unlockHandler, { once: true });
      window.addEventListener('touchstart', unlockHandler, { once: true });
      window.addEventListener('click', unlockHandler, { once: true });
    }
  }

  /**
   * Unlock AudioContext and speech engine on user interaction
   */
  public unlock() {
    if (this.isUnlocked || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx && !this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      this.isUnlocked = true;
    } catch {
      // Ignore unlock errors
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.cachedVoices = voices;
      }
      return voices || [];
    } catch {
      return [];
    }
  }

  public getStatus(): SpeechStatus {
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!isSupported) {
      return { isSupported: false, hasVietnameseVoice: false, availableVoices: [] };
    }

    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.loadVoices();
    const viVoice = voices.find(
      v =>
        v.lang.toLowerCase().startsWith('vi') ||
        v.lang.toLowerCase().includes('vn') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt')
    );

    return {
      isSupported: true,
      hasVietnameseVoice: Boolean(viVoice),
      voiceName: viVoice?.name,
      availableVoices: voices
    };
  }

  public getVietnameseVoice(): SpeechSynthesisVoice | null {
    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.loadVoices();

    const preferredNames = ['linh', 'mai', 'an', 'hoa', 'female', 'google tiếng việt', 'vietnam'];
    const viVoices = voices.filter(
      v => v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vn')
    );

    if (viVoices.length === 0) return null;

    for (const name of preferredNames) {
      const found = viVoices.find(v => v.name.toLowerCase().includes(name));
      if (found) return found;
    }

    return viVoices[0];
  }

  public stopAll() {
    // 1. Stop HTML5 audio
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }

    // 2. Stop Web Audio buffer source
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {}
      this.currentSourceNode = null;
    }

    // 3. Stop speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.currentUtterance = null;
  }

  /**
   * Helper: Matches text to built-in preschool Vietnamese audio clips
   */
  public getBuiltinAudioForText(text: string): string | null {
    if (!text) return null;
    const t = text.trim().toLowerCase();

    // Core preschool answers:
    if (t === 'đôi mắt' || t.includes('mắt') || t.includes('eye')) {
      return BUILTIN_VIETNAMESE_AUDIO['eyes'] || null;
    }
    if (t === 'cái mũi' || t.includes('mũi') || t.includes('nose')) {
      return BUILTIN_VIETNAMESE_AUDIO['nose'] || null;
    }
    if (t === 'cái miệng' || t.includes('miệng') || t.includes('mouth')) {
      return BUILTIN_VIETNAMESE_AUDIO['mouth'] || null;
    }
    if (t === 'đôi tai' || t.includes('tai') || t.includes('ear')) {
      return BUILTIN_VIETNAMESE_AUDIO['ears'] || null;
    }

    // Prompts and celebrations:
    if (t.includes('chưa soi trúng') || t.includes('kính lúp chưa')) {
      return BUILTIN_VIETNAMESE_AUDIO['not_found'] || null;
    }
    if (t.includes('khuôn mặt đáng yêu') || t.includes('đây là khuôn mặt')) {
      return BUILTIN_VIETNAMESE_AUDIO['full_face'] || null;
    }
    if (t.includes('bé giỏi quá') || t.includes('các bé giỏi quá')) {
      return BUILTIN_VIETNAMESE_AUDIO['celebrate'] || null;
    }

    return null;
  }

  /**
   * Play audio via Web Audio API (instant, resilient against Safari autoplay restrictions)
   * with fallback to HTML5 Audio element.
   */
  public playAudioUrl(url: string, onEnd?: () => void, onError?: (err: unknown) => void): Promise<void> {
    return new Promise(resolve => {
      this.stopAll();
      this.unlock();

      // Attempt 1: Web Audio API if base64 data URL
      if (url.startsWith('data:audio') && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (AudioCtx) {
          if (!this.audioCtx) {
            this.audioCtx = new AudioCtx();
          }
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
          }

          // Check buffer cache
          const cached = this.audioBufferCache.get(url);
          if (cached) {
            this.playAudioBuffer(cached, onEnd, resolve);
            return;
          }

          // Convert base64 data URL to ArrayBuffer
          try {
            const base64Data = url.split(',')[1];
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            this.audioCtx
              .decodeAudioData(bytes.buffer.slice(0))
              .then(buffer => {
                this.audioBufferCache.set(url, buffer);
                this.playAudioBuffer(buffer, onEnd, resolve);
              })
              .catch(() => {
                // Fall back to standard HTML5 Audio
                this.playWithHtmlAudio(url, onEnd, onError, resolve);
              });
            return;
          } catch {
            // Fall back to standard HTML5 Audio
          }
        }
      }

      // Attempt 2: Standard HTML5 Audio
      this.playWithHtmlAudio(url, onEnd, onError, resolve);
    });
  }

  private playAudioBuffer(buffer: AudioBuffer, onEnd?: () => void, resolve?: () => void) {
    if (!this.audioCtx) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      this.currentSourceNode = source;

      source.onended = () => {
        this.currentSourceNode = null;
        onEnd?.();
        resolve?.();
      };

      source.start(0);
    } catch {
      onEnd?.();
      resolve?.();
    }
  }

  private playWithHtmlAudio(
    url: string,
    onEnd?: () => void,
    onError?: (err: unknown) => void,
    resolve?: () => void
  ) {
    try {
      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        onEnd?.();
        resolve?.();
      };

      audio.onerror = e => {
        this.currentAudio = null;
        onError?.(e);
        resolve?.();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          this.currentAudio = null;
          onError?.(err);
          resolve?.();
        });
      }
    } catch (err) {
      this.currentAudio = null;
      onError?.(err);
      resolve?.();
    }
  }

  /**
   * Speaks Vietnamese text.
   * Prioritizes high quality built-in native voice clips for the 4 core answers.
   * If custom text, falls back to Web Speech API with resilient voice and language handling.
   */
  public speakVietnamese(
    text: string,
    rate = 0.9,
    pitch = 1.05,
    onEnd?: () => void,
    onMissingVoice?: () => void
  ): boolean {
    if (typeof window === 'undefined') {
      onEnd?.();
      return false;
    }

    this.stopAll();
    this.unlock();

    const cleanText = (text || '').trim();
    if (!cleanText) {
      onEnd?.();
      return true;
    }

    // 1. Check if we have pre-rendered native Vietnamese audio for this answer!
    const builtinAudio = this.getBuiltinAudioForText(cleanText);
    if (builtinAudio) {
      this.playAudioUrl(builtinAudio, onEnd);
      return true;
    }

    // 2. Fallback to Web Speech API for custom teacher texts
    if (!('speechSynthesis' in window)) {
      onMissingVoice?.();
      onEnd?.();
      return false;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.getVietnameseVoice();

      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = 'vi-VN';
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        onEnd?.();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      onEnd?.();
      return false;
    }
  }
}

export const speechService = new SpeechService();
