/**
 * Video Compositor & Timeline Controller
 * Coordinates the 9:16 (1080x1920) 60 FPS Canvas rendering loop,
 * background layers, procedural FX, kinetic subtitles, progress bars, and timeline playback.
 */

import { CaptionAnimator } from './caption-animator.js';
import { MediaService } from './media-service.js';
import { AudioMixer } from './audio-mixer.js';
import { TTSEngine } from './tts-engine.js';

export const Compositor = {
  canvas: null,
  ctx: null,
  width: 1080,
  height: 1920,

  project: null,
  isPlaying: false,
  currentTimeSec: 0,
  totalDurationSec: 0,
  lastFrameTime: 0,
  animationFrameId: null,

  currentSceneIndex: 0,
  sceneStartTimes: [],

  // Settings
  bgType: 'cyber-grid',
  captionStyle: 'hormozi',
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
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Start passive animation loop to draw preview even when paused
    this.startRenderingLoop();
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

    this.totalDurationSec = accTime;
    this.seek(0);
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

    // Trigger TTS voice for the active scene
    this.speakCurrentScene();
  },

  pause() {
    this.isPlaying = false;
    AudioMixer.stopMusic();
    TTSEngine.stop();
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
  },

  speakCurrentScene() {
    const info = this.getCurrentSceneInfo();
    if (!info || !info.scene) return;

    AudioMixer.setSpeechActive(true);
    TTSEngine.speakText({
      text: info.scene.text,
      onEnd: () => {
        AudioMixer.setSpeechActive(false);
      },
    });
  },

  startRenderingLoop() {
    const loop = (timestamp) => {
      if (this.lastFrameTime === 0) this.lastFrameTime = timestamp;
      const deltaTime = (timestamp - this.lastFrameTime) / 1000;
      this.lastFrameTime = timestamp;

      if (this.isPlaying && this.totalDurationSec > 0) {
        const prevSceneIdx = this.currentSceneIndex;
        this.currentTimeSec += deltaTime;

        // Check scene transition
        const info = this.getCurrentSceneInfo();
        if (info && info.sceneIndex !== prevSceneIdx) {
          this.currentSceneIndex = info.sceneIndex;
          AudioMixer.playSfx('whoosh');
          if (this.onSceneChange) this.onSceneChange(this.currentSceneIndex);
          this.speakCurrentScene();
        }

        // Check playback end
        if (this.currentTimeSec >= this.totalDurationSec) {
          this.currentTimeSec = this.totalDurationSec;
          this.pause();
          if (this.onPlaybackEnd) this.onPlaybackEnd();
        }

        if (this.onTimeUpdate) {
          this.onTimeUpdate(this.currentTimeSec, this.totalDurationSec);
        }
      }

      // Render the current 9:16 frame onto canvas
      this.renderFrame(this.currentTimeSec);

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  },

  renderFrame(timeSec) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const info = this.getCurrentSceneInfo();
    const currentScene = info?.scene;
    const sceneElapsed = info?.sceneElapsed || 0;

    // 1. LAYER: Background
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
        fontSize: this.fontSize,
        yPercent: this.captionYPercent,
        customColors: this.customColors,
      });
    }

    // 4. LAYER: Top Segmented Progress Bar (Shorts/TikTok style)
    if (this.showProgressBar && this.project) {
      this.drawTopProgressBar(ctx, w, h);
    }
  },

  drawBackground(ctx, w, h, timeSec, currentScene) {
    const customMedia = currentScene ? MediaService.getCustomMedia(currentScene.id) : null;

    if (customMedia) {
      if (customMedia.type === 'video' && customMedia.element) {
        // Draw user uploaded or cached video
        ctx.drawImage(customMedia.element, 0, 0, w, h);
        return;
      } else if (customMedia.type === 'image' && customMedia.element) {
        // Draw user uploaded image with smooth Ken-Burns zoom
        const scale = 1.0 + (timeSec % 5) * 0.03;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.drawImage(customMedia.element, -w / 2, -h / 2, w, h);
        ctx.restore();
        return;
      }
    }

    // Procedural 60 FPS motion graphics
    const bgRenderer = MediaService.proceduralBackgrounds[this.bgType] || MediaService.proceduralBackgrounds['cyber-grid'];
    bgRenderer.draw(ctx, w, h, timeSec);
  },

  drawContrastOverlay(ctx, w, h) {
    // Top & Bottom gradient for maximum caption readability
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.2, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.1)');
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  },

  drawTopProgressBar(ctx, w, h) {
    if (!this.project || !this.project.scenes.length) return;

    const scenes = this.project.scenes;
    const barY = 32;
    const barHeight = 8;
    const paddingX = 40;
    const gap = 12;

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
      ctx.roundRect(segX, barY, segmentWidth, barHeight, 4);
      ctx.fill();

      // Active fill
      if (progress > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(segX, barY, segmentWidth * progress, barHeight, 4);
        ctx.fill();
      }
    });
  },
};
