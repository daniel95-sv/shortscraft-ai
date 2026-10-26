/**
 * Web Audio API Real-time Mixer & Procedural Synthesizer
 * Features procedural royalty-free music loops, sound effects, auto-ducking,
 * custom music loading, and MediaStream destination for video recording.
 */

export const AudioMixer = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  masterGain: null,
  mediaStreamDest: null,
  isPlaying: false,
  isDucked: false,
  currentTrackId: 'lofi',
  targetVolume: 0.25,
  loopTimer: null,
  customAudioBuffer: null,
  customAudioSource: null,

  /**
   * Initializes the AudioContext on first user gesture
   */
  init() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.targetVolume;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.45;

    this.speechGain = this.ctx.createGain();
    this.speechGain.gain.value = 1.0;

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.speechGain.connect(this.masterGain);

    // Connect to hardware speakers
    this.masterGain.connect(this.ctx.destination);

    // Media stream destination for MediaRecorder canvas video recording
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.mediaStreamDest);
  },

  /**
   * Plays an audio buffer (e.g. ElevenLabs AI speech) through speechGain.
   * Feeds directly into both hardware speakers and MediaStreamDestination for video recording!
   */
  playSpeechBuffer(buffer, onEnd) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopSpeechBuffer();

    if (!buffer) {
      if (onEnd) onEnd();
      return null;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.speechGain);

    this.currentSpeechSource = source;
    this.setSpeechActive(true);

    source.onended = () => {
      this.setSpeechActive(false);
      this.currentSpeechSource = null;
      if (onEnd) onEnd();
    };

    source.start(0);
    return source;
  },

  stopSpeechBuffer() {
    if (this.currentSpeechSource) {
      try {
        this.currentSpeechSource.stop();
      } catch (e) {}
      this.currentSpeechSource = null;
      this.setSpeechActive(false);
    }
  },

  getMediaStream() {
    this.init();
    if (!this.mediaStreamDest && this.ctx) {
      this.mediaStreamDest = this.ctx.createMediaStreamDestination();
      this.masterGain?.connect(this.mediaStreamDest);
    }
    return this.mediaStreamDest ? this.mediaStreamDest.stream : null;
  },

  /**
   * Auto-Ducking: Smoothly lowers background music volume when speech occurs
   */
  setSpeechActive(isSpeaking) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);

    if (isSpeaking) {
      // Duck down to 20% of target volume
      const duckedVol = this.targetVolume * 0.2;
      this.musicGain.gain.linearRampToValueAtTime(duckedVol, now + 0.15);
      this.isDucked = true;
    } else {
      // Restore back to target volume
      this.musicGain.gain.linearRampToValueAtTime(this.targetVolume, now + 0.3);
      this.isDucked = false;
    }
  },

  setMusicVolume(val) {
    this.targetVolume = Math.max(0, Math.min(val, 1.0));
    if (this.ctx && this.musicGain && !this.isDucked) {
      this.musicGain.gain.setValueAtTime(this.targetVolume, this.ctx.currentTime);
    }
  },

  /**
   * Plays a dynamic Sound Effect (Whoosh, Ding, Pop)
   */
  playSfx(type = 'whoosh') {
    try {
      this.init();
      if (!this.ctx || !this.sfxGain) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;

    if (type === 'whoosh') {
      // Filtered noise sweep
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(2800, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.35);
    } else if (type === 'pop') {
      // Bouncy pitch drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'ding') {
      // Bell chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1320, now); // E6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.5);
    }
    } catch (e) {
      console.warn('SFX playback error ignored:', e);
    }
  },

  /**
   * Starts background procedural rhythm loop
   */
  startMusic(trackId = 'lofi') {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopMusic();

    this.currentTrackId = trackId;
    this.isPlaying = true;

    if (this.customAudioBuffer) {
      this.playCustomBuffer();
      return;
    }

    this.runProceduralLoop();
  },

  runProceduralLoop() {
    if (!this.isPlaying) return;

    const tempo = this.currentTrackId === 'epic' ? 100 : this.currentTrackId === 'upbeat' ? 124 : 85;
    const beatIntervalMs = (60 / tempo) * 1000;

    // Trigger chords & beat
    this.scheduleChord(this.currentTrackId);

    this.loopTimer = setTimeout(() => {
      this.runProceduralLoop();
    }, beatIntervalMs * 4); // 4-beat bar loop
  },

  scheduleChord(trackId) {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;

    const chordNotes = {
      lofi: [261.63, 329.63, 392.0, 493.88], // Cmaj7
      epic: [130.81, 196.0, 261.63, 311.13], // C minor power
      upbeat: [293.66, 369.99, 440.0, 587.33], // D major
      suspense: [110.0, 164.81, 220.0, 233.08], // A dim
    }[trackId] || [261.63, 329.63, 392.0];

    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = trackId === 'lofi' ? 'sine' : trackId === 'epic' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 2.3);
    });
  },

  loadCustomMusic(file) {
    this.init();
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        this.customAudioBuffer = await this.ctx.decodeAudioData(e.target.result);
      } catch (err) {
        console.error('Failed to decode audio file', err);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  playCustomBuffer() {
    if (!this.customAudioBuffer || !this.ctx) return;
    this.customAudioSource = this.ctx.createBufferSource();
    this.customAudioSource.buffer = this.customAudioBuffer;
    this.customAudioSource.loop = true;
    this.customAudioSource.connect(this.musicGain);
    this.customAudioSource.start();
  },

  stopMusic() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.customAudioSource) {
      try {
        this.customAudioSource.stop();
      } catch (e) {}
      this.customAudioSource = null;
    }
  },
};
