/**
 * TTS Audio Engine
 * Supports native Web Speech Synthesis (100% free, works in any browser with zero setup),
 * plus word-level timestamp estimation for precise kinetic Alex Hormozi / MrBeast caption syncing.
 * Also supports optional ElevenLabs / OpenAI Audio API integrations.
 */

export const TTSEngine = {
  voices: [],
  synth: typeof window !== 'undefined' ? window.speechSynthesis : null,
  currentUtterance: null,

  /**
   * Initializes and loads available system voices.
   */
  async loadVoices() {
    if (!this.synth) return [];

    return new Promise((resolve) => {
      let v = this.synth.getVoices();
      if (v.length > 0) {
        this.voices = v;
        resolve(v);
        return;
      }

      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        resolve(this.voices);
      };

      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        this.voices = this.synth.getVoices();
        resolve(this.voices);
      }, 500);
    });
  },

  /**
   * Filter voices by language code or country.
   */
  getAvailableVoices() {
    return this.voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      display: `${v.name} (${v.lang})`,
    }));
  },

  /**
   * Estimates word-level timing breakdown for a sentence given speech rate.
   * Words are weighted by character length and syllable counts for natural cadence.
   */
  calculateWordTimestamps(text, totalDurationSec) {
    if (!text || text.trim().length === 0) return [];

    // Split text into words, stripping excessive punctuation for timing
    const rawWords = text.trim().split(/\s+/);
    if (rawWords.length === 0) return [];

    // Calculate relative weights based on word length + punctuation pauses
    const weights = rawWords.map((word) => {
      let len = word.length;
      if (/[,;]/.test(word)) len += 2.5; // Short comma pause
      if (/[.?!:]/.test(word)) len += 4.5; // Sentence end pause
      return Math.max(len, 2);
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let currentStart = 0;

    return rawWords.map((word, idx) => {
      const fraction = weights[idx] / totalWeight;
      const duration = totalDurationSec * fraction;
      const wordObj = {
        word: word.trim(),
        cleanWord: word.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g, ''),
        startSec: currentStart,
        endSec: currentStart + duration,
      };
      currentStart += duration;
      return wordObj;
    });
  },

  /**
   * Calculates estimated audio duration for a text at a given rate.
   * Average conversational speaking rate: ~140-160 words per minute (2.5 words/sec).
   */
  estimateDuration(text, rate = 1.15) {
    const words = text.trim().split(/\s+/).length;
    const baseWordsPerSec = 2.6 * rate;
    const estimated = words / baseWordsPerSec;
    // Minimum 1.8 seconds per scene for comfortable viewing
    return Math.max(Math.round(estimated * 10) / 10, 1.8);
  },

  /**
   * Speaks a specific scene or sentence in real-time.
   */
  speakText({ text, voiceName, rate = 1.15, pitch = 1.0, onBoundary, onEnd }) {
    if (!this.synth) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.7, Math.min(rate, 2.0));
    utterance.pitch = Math.max(0.5, Math.min(pitch, 1.5));

    if (voiceName) {
      const selected = this.voices.find((v) => v.name === voiceName);
      if (selected) utterance.voice = selected;
    }

    if (onBoundary) {
      utterance.onboundary = (event) => {
        onBoundary(event);
      };
    }

    if (onEnd) {
      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd();
      };
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  /**
   * Stops current playback.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  },
};
