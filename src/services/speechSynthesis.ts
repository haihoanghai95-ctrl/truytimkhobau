/**
 * Vietnamese Text-to-Speech service using Web Speech API
 * Strictly enforces Vietnamese language voice (vi-VN) without falling back to an English voice that butchers Vietnamese.
 */

export interface SpeechStatus {
  isSupported: boolean;
  hasVietnameseVoice: boolean;
  voiceName?: string;
  availableVoices: SpeechSynthesisVoice[];
}

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    this.cachedVoices = voices;
    return voices;
  }

  public getStatus(): SpeechStatus {
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!isSupported) {
      return { isSupported: false, hasVietnameseVoice: false, availableVoices: [] };
    }

    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.loadVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi') || v.lang.includes('VN') || v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('tiếng việt'));

    return {
      isSupported: true,
      hasVietnameseVoice: Boolean(viVoice),
      voiceName: viVoice?.name,
      availableVoices: voices
    };
  }

  public getVietnameseVoice(): SpeechSynthesisVoice | null {
    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : this.loadVoices();
    
    // Prioritize natural Vietnamese female voices if available
    const preferredNames = ['linh', 'mai', 'an', 'hoa', 'female', 'google tiếng việt'];
    const viVoices = voices.filter(v => v.lang.toLowerCase().startsWith('vi') || v.lang.toLowerCase().includes('vn'));

    if (viVoices.length === 0) return null;

    for (const name of preferredNames) {
      const found = viVoices.find(v => v.name.toLowerCase().includes(name));
      if (found) return found;
    }

    return viVoices[0];
  }

  public stopAll() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Play teacher uploaded audio file or base64 audio
   */
  public playAudioUrl(url: string, onEnd?: () => void, onError?: (err: unknown) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopAll();
      try {
        const audio = new Audio(url);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          onEnd?.();
          resolve();
        };

        audio.onerror = (e) => {
          this.currentAudio = null;
          onError?.(e);
          reject(e);
        };

        audio.play().catch((err) => {
          this.currentAudio = null;
          onError?.(err);
          reject(err);
        });
      } catch (err) {
        this.currentAudio = null;
        onError?.(err);
        reject(err);
      }
    });
  }

  /**
   * Speaks Vietnamese text using Web Speech API
   * If no Vietnamese voice is installed, reports back cleanly so the UI can notify the teacher.
   */
  public speakVietnamese(
    text: string,
    rate = 0.95,
    pitch = 1.05,
    onEnd?: () => void,
    onMissingVoice?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onMissingVoice?.();
      return false;
    }

    this.stopAll();

    const voice = this.getVietnameseVoice();
    if (!voice) {
      // Do NOT read Vietnamese with an English voice!
      onMissingVoice?.();
      return false;
    }

    const cleanText = text.trim();
    if (!cleanText) {
      onEnd?.();
      return true;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = voice;
    utterance.lang = 'vi-VN';
    utterance.rate = rate; // Toddler friendly tempo (slightly slower than standard)
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
  }
}

export const speechService = new SpeechService();
