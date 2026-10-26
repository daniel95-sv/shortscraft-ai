/**
 * TTS Audio Engine
 * Supports native Web Speech Synthesis (100% free, works in any browser with zero setup),
 * plus word-level timestamp estimation for precise kinetic Alex Hormozi / MrBeast caption syncing.
 * Also supports optional ElevenLabs / OpenAI Audio API integrations.
 */

import { AudioMixer } from './audio-mixer.js';

export const TTSEngine = {
  voices: [],
  synth: typeof window !== 'undefined' ? window.speechSynthesis : null,
  currentUtterance: null,

  // ElevenLabs State & Cache
  elevenLabsVoices: [],
  audioBufferCache: new Map(), // key: `${voiceId}_${text}` -> AudioBuffer
  isGeneratingAudio: false,

  PRESET_ELEVENLABS_VOICES: [
    { voice_id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger - Resonant & Casual (Español/Multilingual)' },
    { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah - Confident & Warm (Español/Multilingual)' },
    { voice_id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura - Enthusiast & Quirky (Español/Multilingual)' },
    { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Calm & Narrative' },
    { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Deep & Impactful' },
  ],

  /**
   * Initializes and loads available system Web Speech API voices.
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
   * Loads custom or workspace voices from ElevenLabs API.
   */
  async loadElevenLabsVoices(apiKey) {
    if (!apiKey) return this.PRESET_ELEVENLABS_VOICES;

    try {
      const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });
      if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.voices) && data.voices.length > 0) {
        this.elevenLabsVoices = data.voices.map((v) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: v.category,
          preview_url: v.preview_url,
        }));
        return this.elevenLabsVoices;
      }
    } catch (err) {
      console.warn('Failed to load ElevenLabs voices from API, using presets:', err);
    }
    this.elevenLabsVoices = this.PRESET_ELEVENLABS_VOICES;
    return this.elevenLabsVoices;
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
   * Fetches and decodes ElevenLabs audio for a given sentence.
   */
  async getElevenLabsAudioBuffer({ text, voiceId = 'CwhRBWXzGAHq8TQ4Fs17', apiKey }) {
    if (!apiKey || !text) return null;

    const cacheKey = `${voiceId}_${text.trim()}`;
    if (this.audioBufferCache.has(cacheKey)) {
      return this.audioBufferCache.get(cacheKey);
    }

    AudioMixer.init();
    const ctx = AudioMixer.ctx;
    if (!ctx) return null;

    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`ElevenLabs ${res.status}: ${errText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      // Decode audio data into AudioBuffer
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBufferCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn('ElevenLabs TTS audio fetch error:', err);
      return null;
    }
  },

  /**
   * Pre-generates ElevenLabs audio for all scenes in a project
   * so playback and 60 FPS video recording have zero network lag!
   */
  async pregenerateProjectElevenLabs({ project, voiceId, apiKey, onProgress }) {
    if (!project || !project.scenes || !apiKey) return;

    const total = project.scenes.length;
    for (let i = 0; i < total; i++) {
      const scene = project.scenes[i];
      if (onProgress) {
        onProgress({ current: i + 1, total, sceneIndex: i });
      }

      const buffer = await this.getElevenLabsAudioBuffer({
        text: scene.text,
        voiceId,
        apiKey,
      });

      if (buffer && buffer.duration) {
        // Adapt scene duration comfortably to spoken audio length (+ 0.6s tail)
        const naturalDuration = Math.max(Math.round((buffer.duration + 0.6) * 10) / 10, 2.0);
        scene.durationSec = naturalDuration;
        scene.words = this.calculateWordTimestamps(scene.text, scene.durationSec);
      }
    }
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

    // Natural 0.18s audio lead-in before first syllable, and 0.4s breath tail
    const leadInSec = 0.18;
    const trailSec = 0.4;
    const spokenDuration = Math.max(totalDurationSec - leadInSec - trailSec, 0.8);
    let currentStart = leadInSec;

    return rawWords.map((word, idx) => {
      const fraction = weights[idx] / totalWeight;
      const duration = spokenDuration * fraction;
      const wordObj = {
        word: word.trim(),
        cleanWord: word.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g, ''),
        startSec: Math.round(currentStart * 100) / 100,
        endSec: Math.round((currentStart + duration) * 100) / 100,
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
   * Uses ElevenLabs AudioBuffer if active and available; otherwise Web Speech API.
   */
  async speakText({
    text,
    voiceName,
    rate = 1.15,
    pitch = 1.0,
    onBoundary,
    onEnd,
    engine = 'webspeech',
    elevenLabsApiKey = '',
    elevenLabsVoiceId = 'CwhRBWXzGAHq8TQ4Fs17',
  }) {
    this.stop();

    if (engine === 'elevenlabs' && elevenLabsApiKey) {
      // Check cache first
      const cacheKey = `${elevenLabsVoiceId}_${text.trim()}`;
      let buffer = this.audioBufferCache.get(cacheKey);

      if (!buffer) {
        buffer = await this.getElevenLabsAudioBuffer({
          text,
          voiceId: elevenLabsVoiceId,
          apiKey: elevenLabsApiKey,
        });
      }

      if (buffer) {
        AudioMixer.playSpeechBuffer(buffer, onEnd);
        return;
      }
      // If ElevenLabs failed or offline, fall through smoothly to native Web Speech API
      console.warn('ElevenLabs unavailable, falling back to Web Speech API');
    }

    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

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
      utterance.onerror = () => {
        this.currentUtterance = null;
        onEnd();
      };
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  /**
   * Stops current playback from both native TTS and AudioMixer speech buffer.
   */
  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.currentUtterance = null;
    }
    AudioMixer.stopSpeechBuffer();
  },
};
