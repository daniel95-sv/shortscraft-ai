/**
 * Video Compositor & Timeline Controller
 * Coordinates high-performance 9:16 Canvas rendering,
 * background layers, procedural FX, kinetic subtitles, progress bars, and timeline playback.
 * 
 * Optimized for butter-smooth 60 FPS playback with zero idle CPU/GPU usage:
 * - Adaptive dual-resolution (540x960 for blazing fast preview, 1080x1920 for crystal export)
 * - Render-on-demand when paused (0% CPU/GPU when idle)
 * - Hardware compositing flags
 */

import { CaptionAnimator } from './caption-animator.js';
import { MediaService } from './media-service.js';
import { AudioMixer } from './audio-mixer.js';
import { TTSEngine } from './tts-engine.js';

export const Compositor = {
  canvas: null,
  ctx: null,
  width: 540,
  height: 960,
  baseWidth: 1080,
  baseHeight: 1920,
  orientation: 'portrait', // 'portrait' (9:16) or 'landscape' (16:9)
  paddingBackSec: 1.5, // 1500ms tail time after last narration

  project: null,
  isPlaying: false,
  currentTimeSec: 0,
  totalDurationSec: 0,
  lastFrameTime: 0,
  animationFrameId: null,
  renderRequested: false,

  currentSceneIndex: 0,
  sceneStartTimes: [],

  // Settings
  bgType: 'cyber-grid',
  captionStyle: 'hormozi',
  fontFamily: 'Anton',
  fontSize: 58,
  captionYPercent: 70,
  showProgressBar: true,
  customColors: null,

  // Listeners
  onTimeUpdate: null,
  onSceneChange: null,
  onPlaybackEnd: null,

  init(canvasElement) {
    this.canvas = canvasElement;
    // Request optimized 2D context
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    this.setOrientation(this.orientation);
    // Draw initial frame on demand (no idle looping)
    this.requestRender();
  },

  setOrientation(orientation) {
    this.orientation = orientation === 'landscape' ? 'landscape' : 'portrait';
    if (this.orientation === 'landscape') {
      this.baseWidth = 1920;
      this.baseHeight = 1080;
      this.width = 960;
      this.height = 540;
    } else {
      this.baseWidth = 1080;
      this.baseHeight = 1920;
      this.width = 540;
      this.height = 960;
    }

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.requestRender();
  },

  setResolution(w, h) {
    this.width = w;
    this.height = h;
    if (this.canvas) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.requestRender();
  },

  loadProject(project) {
    this.project = project;
    this.currentTimeSec = 0;
    this.currentSceneIndex = 0;

    // Calculate scene timeline offsets and total duration
    let accTime = 0;
    this.sceneStartTimes = [];

    this.project.scenes.forEach((scene) => {
      this.sceneStartTimes.push(accTime);
      accTime += scene.durationSec;

      // Ensure word timestamps exist
      if (!scene.words || scene.words.length === 0) {
        scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
      }
    });

    this.totalDurationSec = accTime + (this.paddingBackSec || 0);
    this.seek(0);
    this.requestRender();
  },

  getCurrentSceneInfo() {
    if (!this.project || !this.project.scenes.length) return null;

    let sceneIdx = 0;
    for (let i = this.sceneStartTimes.length - 1; i >= 0; i--) {
      if (this.currentTimeSec >= this.sceneStartTimes[i]) {
        sceneIdx = i;
        break;
      }
    }

    const scene = this.project.scenes[sceneIdx];
    const sceneStart = this.sceneStartTimes[sceneIdx];
    const sceneElapsed = this.currentTimeSec - sceneStart;

    return {
      sceneIndex: sceneIdx,
      scene,
      sceneStart,
      sceneElapsed,
      duration: scene?.durationSec || 4,
    };
  },

  play() {
    if (!this.project) return;
    AudioMixer.init();
    AudioMixer.startMusic(this.project.musicMood || 'lofi');

    this.isPlaying = true;
    this.lastFrameTime = performance.now();

    // Trigger custom video playback if active scene has one
    const info = this.getCurrentSceneInfo();
    if (info && info.scene) {
      const media = MediaService.getCustomMedia(info.scene.id);
      if (media?.type === 'video' && media.element) {
        media.element.play().catch(() => {});
      }
    }

    // Trigger TTS voice for the active scene
    this.speakCurrentScene();

    // Start active 60 FPS playback loop
    this.startPlaybackLoop();
  },

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Pause any playing custom video elements
    MediaService.customMedia.forEach((media) => {
      if (media.type === 'video' && media.element && !media.element.paused) {
        media.element.pause();
      }
    });
    AudioMixer.stopMusic();
    TTSEngine.stop();
    this.requestRender();
  },

  seek(timeSec) {
    const prevSceneIdx = this.currentSceneIndex;
    this.currentTimeSec = Math.max(0, Math.min(timeSec, this.totalDurationSec));

    const info = this.getCurrentSceneInfo();
    if (info && info.sceneIndex !== prevSceneIdx) {
      this.currentSceneIndex = info.sceneIndex;
      if (this.onSceneChange) this.onSceneChange(this.currentSceneIndex);
      if (this.isPlaying) {
        this.speakCurrentScene();
      }
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTimeSec, this.totalDurationSec);
    }

    if (!this.isPlaying) {
      this.requestRender();
    }
  },

  // TTS Config
  voiceName: '',
  speechRate: 1.15,
  ttsEngine: 'webspeech', // 'webspeech' | 'elevenlabs'
  elevenLabsApiKey: '',
  elevenLabsVoiceId: 'CwhRBWXzGAHq8TQ4Fs17',

  speakCurrentScene() {
    const info = this.getCurrentSceneInfo();
    if (!info || !info.scene) return;

    AudioMixer.setSpeechActive(true);
    TTSEngine.speakText({
      text: info.scene.text,
      voiceName: this.voiceName,
      rate: this.speechRate || 1.15,
      engine: this.ttsEngine || 'webspeech',
      elevenLabsApiKey: this.elevenLabsApiKey || '',
      elevenLabsVoiceId: this.elevenLabsVoiceId || 'CwhRBWXzGAHq8TQ4Fs17',
      onEnd: () => {
        AudioMixer.setSpeechActive(false);
      },
    });
  },

  /**
   * Active Playback Loop: Only runs when video is playing or exporting
   */
  startPlaybackLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const loop = (timestamp) => {
      if (!this.isPlaying) return;

      if (this.lastFrameTime === 0) this.lastFrameTime = timestamp;
      // Clamp delta to prevent massive jumps on background tabs
      const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = timestamp;

      if (this.totalDurationSec > 0) {
        const prevSceneIdx = this.currentSceneIndex;
        this.currentTimeSec += deltaTime;

        // Check scene transition
        const info = this.getCurrentSceneInfo();
        if (info && info.sceneIndex !== prevSceneIdx) {
          // Pause previous scene's video if applicable
          const prevScene = this.project.scenes[prevSceneIdx];
          if (prevScene) {
            const prevMedia = MediaService.getCustomMedia(prevScene.id);
            if (prevMedia?.type === 'video' && prevMedia.element && !prevMedia.element.paused) {
              prevMedia.element.pause();
            }
          }

          this.currentSceneIndex = info.sceneIndex;
          AudioMixer.playSfx('whoosh');
          if (this.onSceneChange) this.onSceneChange(this.currentSceneIndex);
          this.speakCurrentScene();

          // Start current scene's video if present
          if (info.scene) {
            const curMedia = MediaService.getCustomMedia(info.scene.id);
            if (curMedia?.type === 'video' && curMedia.element) {
              curMedia.element.currentTime = 0;
              curMedia.element.play().catch(() => {});
            }
          }
        }

        // Check playback end
        if (this.currentTimeSec >= this.totalDurationSec) {
          this.currentTimeSec = this.totalDurationSec;
          this.pause();
          if (this.onPlaybackEnd) this.onPlaybackEnd();
          return;
        }

        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.currentTimeSec, this.totalDurationSec);
        }
      }

      this.renderFrame(this.currentTimeSec);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  },

  /**
   * Render on Demand: Render a single frame when paused / seeking / editing (Zero idle CPU)
   */
  requestRender() {
    if (this.isPlaying) return;
    if (this.renderRequested) return;
    this.renderRequested = true;

    requestAnimationFrame(() => {
      this.renderRequested = false;
      this.renderFrame(this.currentTimeSec);
    });
  },

  renderFrame(timeSec) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Reset transform & state
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const info = this.getCurrentSceneInfo();
    const currentScene = info?.scene;
    const sceneElapsed = info?.sceneElapsed || 0;

    // 1. LAYER: Background (Optimized procedural FX or user clip)
    this.drawBackground(ctx, w, h, timeSec, currentScene);

    // 2. LAYER: Subtle Vignette & Gradient Contrast Overlay
    this.drawContrastOverlay(ctx, w, h);

    // 3. LAYER: Kinetic Captions
    if (currentScene && currentScene.words) {
      CaptionAnimator.drawCaptions({
        ctx,
        canvasWidth: w,
        canvasHeight: h,
        words: currentScene.words,
        sceneElapsedSec: sceneElapsed,
        styleKey: this.captionStyle,
        fontSize: this.fontSize * (w / 1080),
        yPercent: this.captionYPercent,
        customColors: this.customColors,
        fontFamilyOverride: this.fontFamily,
      });
    }

    // 4. LAYER: Top Segmented Progress Bar
    if (this.showProgressBar && this.project) {
      this.drawTopProgressBar(ctx, w, h);
    }
  },

  drawBackground(ctx, w, h, timeSec, currentScene) {
    const customMedia = currentScene ? MediaService.getCustomMedia(currentScene.id) : null;

    if (customMedia) {
      if (customMedia.type === 'video' && customMedia.element) {
        const vid = customMedia.element;

        if (this.isPlaying && vid.paused) {
          vid.play().catch(() => {});
        } else if (!this.isPlaying && !vid.paused) {
          vid.pause();
        }

        // Draw video frame if ready and valid
        if (vid.readyState >= 2 && vid.videoWidth > 0 && vid.videoHeight > 0) {
          const vw = vid.videoWidth;
          const vh = vid.videoHeight;
          const scale = Math.max(w / vw, h / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.drawImage(vid, (w - dw) / 2, (h - dh) / 2, dw, dh);
          return;
        }
      } else if (customMedia.type === 'image' && customMedia.element) {
        const img = customMedia.element;
        const vw = img.naturalWidth || img.width || w;
        const vh = img.naturalHeight || img.height || h;
        
        // Ken Burns cinematic zoom: smooth 7% camera push over scene duration
        const sceneProg = currentScene?.durationSec ? Math.min(1, Math.max(0, (timeSec % currentScene.durationSec) / currentScene.durationSec)) : ((timeSec % 5) / 5);
        const subtleZoom = 1.0 + (sceneProg * 0.08);
        const scale = Math.max(w / vw, h / vh) * subtleZoom;
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        return;
      }
    }

    // Procedural high-performance motion graphics (fallback or default)
    const bgRenderer = MediaService.proceduralBackgrounds[this.bgType] || MediaService.proceduralBackgrounds['cyber-grid'];
    bgRenderer.draw(ctx, w, h, timeSec);
  },

  drawContrastOverlay(ctx, w, h) {
    // Subtle, modern lower-third gradient for crisp subtitle legibility without muting video brightness
    const grad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.48)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);
  },

  drawTopProgressBar(ctx, w, h) {
    if (!this.project || !this.project.scenes.length) return;

    const scale = w / 1080;
    const scenes = this.project.scenes;
    const barY = 32 * scale;
    const barHeight = 8 * scale;
    const paddingX = 40 * scale;
    const gap = 12 * scale;
    const radius = Math.max(2, 4 * scale);

    const availableWidth = w - paddingX * 2 - (scenes.length - 1) * gap;
    const segmentWidth = availableWidth / scenes.length;

    scenes.forEach((scene, idx) => {
      const segX = paddingX + idx * (segmentWidth + gap);
      const sceneStart = this.sceneStartTimes[idx];
      const sceneEnd = sceneStart + scene.durationSec;

      let progress = 0;
      if (this.currentTimeSec >= sceneEnd) {
        progress = 1.0;
      } else if (this.currentTimeSec > sceneStart) {
        progress = (this.currentTimeSec - sceneStart) / scene.durationSec;
      }

      // Background segment track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.roundRect(segX, barY, segmentWidth, barHeight, radius);
      ctx.fill();

      // Active fill
      if (progress > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(segX, barY, segmentWidth * progress, barHeight, radius);
        ctx.fill();
      }
    });
  },
};
