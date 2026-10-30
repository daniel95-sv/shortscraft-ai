/**
 * Video Compositor & Timeline Controller
 * Coordinates high-performance Canvas rendering (9:16 vertical & 16:9 horizontal),
 * background layers, seamless video crossfades, procedural FX, kinetic subtitles, and audio.
 * 
 * Optimized for butter-smooth 60 FPS playback:
 * - Speech-driven scene synchronization: voice and subtitles never cut off mid-sentence.
 * - Seamless cinematic crossfade between scenes (no cuts, freezes, or black flashes).
 * - Bulletproof play/pause with auto-rewind on replay and state listeners.
 * - Render-on-demand when paused (0% idle CPU/GPU).
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
  paddingBackSec: 0.5, // 0.5s snappy viral tail after last scene

  project: null,
  isPlaying: false,
  currentTimeSec: 0,
  totalDurationSec: 0,
  lastFrameTime: 0,
  animationFrameId: null,
  renderRequested: false,

  currentSceneIndex: 0,
  previousSceneIndex: -1,
  sceneStartTimes: [],

  // Real-time Speech Sync & Seamless Video Crossfade
  activeSpeechSceneIndex: -1,
  activeSpeechWordIndex: -1,
  isCurrentSceneSpeaking: false,
  crossfadeDuration: 0.40, // 400ms smooth dissolve

  // Settings
  bgType: 'cyber-grid',
  captionStyle: 'hormozi',
  fontFamily: 'Anton',
  fontSize: 54,
  captionYPercent: 70,
  showProgressBar: true,
  showCaptions: true, // Activado por defecto para mostrar el texto de la historia en el video
  customColors: null,

  // Listeners
  onTimeUpdate: null,
  onSceneChange: null,
  onPlaybackEnd: null,
  onPlayStateChange: null,

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    
    this.setOrientation(this.orientation);
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
    this.previousSceneIndex = -1;
    this.activeSpeechSceneIndex = -1;
    this.activeSpeechWordIndex = -1;
    this.isCurrentSceneSpeaking = false;

    // Calculate scene timeline offsets and total duration
    let accTime = 0;
    this.sceneStartTimes = [];

    this.project.scenes.forEach((scene) => {
      this.sceneStartTimes.push(accTime);
      accTime += scene.durationSec;

      // Calculate word timestamps for kinetic karaoke subtitles
      scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
    });

    this.totalDurationSec = accTime + (this.paddingBackSec || 0);

    // Pre-warm and prime all video media
    this.primeProjectMedia();

    this.seek(0);
    if (this.onSceneChange) this.onSceneChange(0);
    this.requestRender();
  },

  primeProjectMedia() {
    if (!this.project || !this.project.scenes) return;
    this.project.scenes.forEach((scene) => {
      const media = MediaService.getCustomMedia(scene.id);
      if (media?.type === 'video' && media.element) {
        const vid = media.element;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = 'auto';
      }
    });
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
    const sceneStart = this.sceneStartTimes[sceneIdx] || 0;
    const sceneElapsed = Math.max(0, this.currentTimeSec - sceneStart);

    return {
      sceneIndex: sceneIdx,
      scene,
      sceneStart,
      sceneElapsed,
      duration: scene?.durationSec || 4,
    };
  },

  play() {
    if (!this.project || !this.project.scenes.length) return;

    // Auto-rewind to start if at the end of the video
    if (this.currentTimeSec >= this.totalDurationSec - 0.1) {
      this.seek(0);
    }

    AudioMixer.init();
    AudioMixer.startMusic(this.project.musicMood || 'lofi');

    this.isPlaying = true;
    this.lastFrameTime = performance.now();

    // Trigger video playback for active and upcoming scene
    const info = this.getCurrentSceneInfo();
    if (info?.scene) {
      const media = MediaService.getCustomMedia(info.scene.id);
      if (media?.type === 'video' && media.element) {
        media.element.play().catch(() => {});
      }
    }

    // Trigger synchronized voice
    this.speakCurrentScene();

    if (this.onPlayStateChange) {
      this.onPlayStateChange(true);
    }

    // Start 60 FPS playback loop
    this.startPlaybackLoop();
  },

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Pause all playing videos
    MediaService.customMedia.forEach((media) => {
      if (media.type === 'video' && media.element && !media.element.paused) {
        media.element.pause();
      }
    });

    AudioMixer.stopMusic();
    TTSEngine.stop();
    this.isCurrentSceneSpeaking = false;

    if (this.onPlayStateChange) {
      this.onPlayStateChange(false);
    }

    this.requestRender();
  },

  seek(timeSec) {
    const prevSceneIdx = this.currentSceneIndex;
    this.currentTimeSec = Math.max(0, Math.min(timeSec, this.totalDurationSec));

    const info = this.getCurrentSceneInfo();
    if (info && info.sceneIndex !== prevSceneIdx) {
      this.previousSceneIndex = prevSceneIdx;
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

    this.activeSpeechSceneIndex = info.sceneIndex;
    this.activeSpeechWordIndex = -1;
    this.isCurrentSceneSpeaking = true;

    AudioMixer.setSpeechActive(true);

    TTSEngine.speakText({
      text: info.scene.text,
      voiceName: this.voiceName,
      rate: this.speechRate || 1.15,
      engine: this.ttsEngine || 'webspeech',
      elevenLabsApiKey: this.elevenLabsApiKey || '',
      elevenLabsVoiceId: this.elevenLabsVoiceId || 'CwhRBWXzGAHq8TQ4Fs17',
      onBoundary: (event) => {
        if (!this.isPlaying) return;
        if (event.name === 'word' || typeof event.charIndex === 'number') {
          const charIdx = event.charIndex;
          const scene = info.scene;
          if (scene?.words?.length) {
            const foundIdx = scene.words.findIndex(
              (w) => charIdx >= w.charIndex && charIdx < w.charIndex + w.length + 1
            );
            if (foundIdx >= 0) {
              this.activeSpeechWordIndex = foundIdx;
              this.activeSpeechSceneIndex = info.sceneIndex;
            }
          }
        }
      },
      onEnd: () => {
        AudioMixer.setSpeechActive(false);
        this.isCurrentSceneSpeaking = false;
        // Keep active speech index until transition completes
      },
    });
  },

  /**
   * Active Playback Loop: Runs during preview or recording
   */
  startPlaybackLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const loop = (timestamp) => {
      if (!this.isPlaying) return;

      if (this.lastFrameTime === 0) this.lastFrameTime = timestamp;
      const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = timestamp;

      if (this.totalDurationSec > 0) {
        const prevSceneIdx = this.currentSceneIndex;
        const curSceneStart = this.sceneStartTimes[this.currentSceneIndex] || 0;
        const curSceneObj = this.project?.scenes[this.currentSceneIndex];
        const curSceneDuration = curSceneObj?.durationSec || 4;
        const plannedSceneEnd = curSceneStart + curSceneDuration;

        // SPEECH SYNCHRONIZATION: If narration is still actively speaking, hold smoothly
        // without abruptly cutting off the speaker's sentence
        if (this.isCurrentSceneSpeaking && this.currentTimeSec >= plannedSceneEnd - 0.05) {
          // Gently stretch timeline slightly to let speaker complete sentence
          this.currentTimeSec = plannedSceneEnd - 0.05;
        } else {
          this.currentTimeSec += deltaTime;
        }

        // Pre-warm the next scene's video before crossfade window starts
        const timeUntilSceneEnd = plannedSceneEnd - this.currentTimeSec;
        if (timeUntilSceneEnd > 0 && timeUntilSceneEnd < 0.60) {
          const nextScene = this.project?.scenes[this.currentSceneIndex + 1];
          if (nextScene) {
            const nextMedia = MediaService.getCustomMedia(nextScene.id);
            if (nextMedia?.type === 'video' && nextMedia.element && nextMedia.element.paused) {
              nextMedia.element.play().catch(() => {});
            }
          }
        }

        // Scene transition check
        const info = this.getCurrentSceneInfo();
        if (info && info.sceneIndex !== prevSceneIdx) {
          this.previousSceneIndex = prevSceneIdx;
          this.currentSceneIndex = info.sceneIndex;

          if (this.onSceneChange) this.onSceneChange(this.currentSceneIndex);
          this.speakCurrentScene();

          // Ensure new scene video is running smoothly
          if (info.scene) {
            const curMedia = MediaService.getCustomMedia(info.scene.id);
            if (curMedia?.type === 'video' && curMedia.element && curMedia.element.paused) {
              curMedia.element.play().catch(() => {});
            }
          }

          // Gracefully pause previous video after crossfade transition finishes
          const oldScene = this.project?.scenes[prevSceneIdx];
          if (oldScene) {
            const oldIdx = prevSceneIdx;
            setTimeout(() => {
              if (this.currentSceneIndex !== oldIdx) {
                const oldMedia = MediaService.getCustomMedia(oldScene.id);
                if (oldMedia?.type === 'video' && oldMedia.element && !oldMedia.element.paused) {
                  oldMedia.element.pause();
                }
              }
            }, 600);
          }
        }

        // Check playback completion
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
   * Render on Demand: Render a single frame when paused / seeking / editing
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

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const info = this.getCurrentSceneInfo();
    const currentScene = info?.scene;
    const sceneElapsed = info?.sceneElapsed || 0;
    const sceneDuration = info?.duration || 4.0;

    // 1. LAYER: Seamless Crossfading Background (video, image, or procedural FX)
    this.drawBackground(ctx, w, h, timeSec, currentScene);

    // 2. LAYER: Cinematic Lower-Third Gradient Contrast (solo cuando los subtítulos están activos)
    if (this.showCaptions) {
      this.drawContrastOverlay(ctx, w, h);
    }

    // 3. LAYER: Full-Sentence Kinetic Captions (Always complete, word karaoke synced)
    if (this.showCaptions && currentScene && currentScene.words) {
      const activeWordIdx = (this.activeSpeechSceneIndex === info?.sceneIndex && this.activeSpeechWordIndex >= 0)
        ? this.activeSpeechWordIndex
        : -1;

      // Smooth subtitle fade during crossfade dissolve
      let captionOpacity = 1.0;
      if (sceneElapsed < 0.20 && this.previousSceneIndex >= 0) {
        captionOpacity = sceneElapsed / 0.20;
      }

      CaptionAnimator.drawCaptions({
        ctx,
        canvasWidth: w,
        canvasHeight: h,
        words: currentScene.words,
        sceneElapsedSec: sceneElapsed,
        sceneDurationSec: sceneDuration,
        styleKey: this.captionStyle,
        fontSize: this.fontSize * (w / 1080),
        yPercent: this.captionYPercent,
        customColors: this.customColors,
        fontFamilyOverride: this.fontFamily,
        activeWordIndexOverride: activeWordIdx,
        opacity: captionOpacity,
      });
    }

    // 4. LAYER: Top Segmented Progress Bar
    if (this.showProgressBar && this.project) {
      this.drawTopProgressBar(ctx, w, h);
    }
  },

  /**
   * Draws a single media item (video, image, or procedural fallback) with opacity control
   */
  drawMediaItem(ctx, w, h, customMedia, currentScene, timeSec, alpha = 1.0) {
    if (alpha <= 0.01) return false;
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0.0, alpha));

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
          ctx.restore();
          return true;
        }
      } else if (customMedia.type === 'image' && customMedia.element) {
        const img = customMedia.element;
        const vw = img.naturalWidth || img.width || w;
        const vh = img.naturalHeight || img.height || h;

        // Subtle Ken Burns cinematic push
        const sceneProg = currentScene?.durationSec ? Math.min(1, Math.max(0, (timeSec % currentScene.durationSec) / currentScene.durationSec)) : ((timeSec % 5) / 5);
        const subtleZoom = 1.0 + (sceneProg * 0.07);
        const scale = Math.max(w / vw, h / vh) * subtleZoom;
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.restore();
        return true;
      }
    }

    // Procedural motion graphics fallback
    const bgRenderer = MediaService.proceduralBackgrounds[this.bgType] || MediaService.proceduralBackgrounds['cyber-grid'];
    bgRenderer.draw(ctx, w, h, timeSec);
    ctx.restore();
    return true;
  },

  drawBackground(ctx, w, h, timeSec, currentScene) {
    const curMedia = currentScene ? MediaService.getCustomMedia(currentScene.id) : null;
    const sceneElapsed = this.getCurrentSceneInfo()?.sceneElapsed || 0;

    // Seamless Dissolve Crossfade between previous scene and current scene
    const isCrossfading = this.previousSceneIndex >= 0 &&
      this.previousSceneIndex !== this.currentSceneIndex &&
      sceneElapsed < this.crossfadeDuration &&
      this.project?.scenes[this.previousSceneIndex];

    if (isCrossfading) {
      const prevScene = this.project.scenes[this.previousSceneIndex];
      const prevMedia = MediaService.getCustomMedia(prevScene.id);
      const crossfadeProg = Math.min(1.0, Math.max(0.0, sceneElapsed / this.crossfadeDuration));

      // Draw outgoing scene
      this.drawMediaItem(ctx, w, h, prevMedia, prevScene, timeSec, 1.0);
      // Blend incoming scene smoothly over it
      this.drawMediaItem(ctx, w, h, curMedia, currentScene, timeSec, crossfadeProg);
    } else {
      // Normal playback
      this.drawMediaItem(ctx, w, h, curMedia, currentScene, timeSec, 1.0);
    }
  },

  drawContrastOverlay(ctx, w, h) {
    // Subtle lower-third contrast gradient for subtitle clarity without dimming video
    const grad = ctx.createLinearGradient(0, h * 0.62, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.50)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
  },

  drawTopProgressBar(ctx, w, h) {
    if (!this.project || !this.project.scenes.length) return;

    const scale = w / 1080;
    const scenes = this.project.scenes;
    const barY = 28 * scale;
    const barHeight = 7 * scale;
    const paddingX = 36 * scale;
    const gap = 10 * scale;
    const radius = Math.max(2, 4 * scale);

    const availableWidth = w - paddingX * 2 - (scenes.length - 1) * gap;
    const segmentWidth = availableWidth / scenes.length;

    scenes.forEach((scene, idx) => {
      const segX = paddingX + idx * (segmentWidth + gap);
      const sceneStart = this.sceneStartTimes[idx] || 0;
      const sceneEnd = sceneStart + scene.durationSec;

      let progress = 0;
      if (this.currentTimeSec >= sceneEnd) {
        progress = 1.0;
      } else if (this.currentTimeSec > sceneStart) {
        progress = (this.currentTimeSec - sceneStart) / scene.durationSec;
      }

      // Track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.roundRect(segX, barY, segmentWidth, barHeight, radius);
      ctx.fill();

      // Active fill
      if (progress > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(segX, barY, segmentWidth * Math.min(1.0, progress), barHeight, radius);
        ctx.fill();
      }
    });
  },
};
