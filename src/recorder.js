/**
 * Video Exporter & MediaRecorder Engine
 * Encodes Canvas and Web Audio directly in the browser into a downloadable video file.
 * Fast, lightweight client-side rendering with zero server costs!
 */

import { Compositor } from './compositor.js';
import { AudioMixer } from './audio-mixer.js';
import { TTSEngine } from './tts-engine.js';

export const VideoExporter = {
  isExporting: false,
  mediaRecorder: null,
  recordedChunks: [],
  progressInterval: null,

  /**
   * Starts real-time in-browser export
   */
  async exportVideo({ onProgress, onComplete, onError, resolution = 'hd' }) {
    if (this.isExporting) return;
    if (!Compositor.project || Compositor.totalDurationSec <= 0) {
      if (onError) onError('No hay ningún proyecto cargado para exportar.');
      return;
    }

    this.isExporting = true;
    this.recordedChunks = [];

    // Pre-cache ElevenLabs audio buffers if enabled
    if (Compositor.ttsEngine === 'elevenlabs' && Compositor.elevenLabsApiKey) {
      if (onProgress) {
        onProgress({
          percent: 0,
          currentSec: 0,
          totalSec: Compositor.totalDurationSec,
          status: 'Sincronizando voces ElevenLabs...',
        });
      }
      try {
        await TTSEngine.pregenerateProjectElevenLabs({
          project: Compositor.project,
          voiceId: Compositor.elevenLabsVoiceId,
          apiKey: Compositor.elevenLabsApiKey,
        });
        Compositor.loadProject(Compositor.project);
      } catch (err) {
        console.warn('ElevenLabs pre-generation warning:', err);
      }
    }

    // Set export resolution:
    // Full HD: 1080x1920 portrait / 1920x1080 landscape
    // Fast HD: 720x1280 portrait / 1280x720 landscape (Fastest, zero lag, crystal clear on phones)
    const isLandscape = Compositor.orientation === 'landscape';
    const targetW = isLandscape ? 1280 : 720;
    const targetH = isLandscape ? 720 : 1280;
    Compositor.setResolution(targetW, targetH);

    const restorePreviewResolution = () => {
      this.isExporting = false;
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
      if (isLandscape) {
        Compositor.setResolution(960, 540);
      } else {
        Compositor.setResolution(540, 960);
      }
    };

    try {
      // 1. Capture 60 FPS video stream from the canvas
      const canvasStream = Compositor.canvas.captureStream(60);

      // 2. Capture audio stream from AudioMixer
      const audioStream = AudioMixer.getMediaStream();
      const audioTracks = audioStream ? audioStream.getAudioTracks() : [];

      // Combine video and audio tracks
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);

      // Detect best supported mimeType
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorderOptions = {
        videoBitsPerSecond: 6000000, // 6 Mbps for smooth, crisp mobile playback
      };
      if (selectedMime) recorderOptions.mimeType = selectedMime;

      this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        restorePreviewResolution();
        Compositor.pause();

        const blobType = selectedMime || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: blobType });
        const downloadUrl = URL.createObjectURL(blob);

        const filename = `${(Compositor.project.title || 'ShortsCraft_Video')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 30)}_${Date.now()}.${blobType.includes('mp4') ? 'mp4' : 'webm'}`;

        if (onComplete) {
          onComplete({ blob, downloadUrl, filename, sizeBytes: blob.size });
        }
      };

      // Rewind to 0 and begin recording
      Compositor.seek(0);
      this.mediaRecorder.start(100);

      const totalDuration = Compositor.totalDurationSec;
      this.progressInterval = setInterval(() => {
        if (!this.isExporting) {
          clearInterval(this.progressInterval);
          this.progressInterval = null;
          return;
        }

        const current = Compositor.currentTimeSec;
        const percent = Math.min(100, Math.round((current / totalDuration) * 100));

        let statusText = `Grabando: ${current.toFixed(1)}s / ${totalDuration.toFixed(1)}s (${percent}%)`;
        if (percent >= 98) {
          statusText = 'Empaquetando archivo de video final...';
        }

        if (onProgress) {
          onProgress({ percent, currentSec: current, totalSec: totalDuration, status: statusText });
        }

        if (current >= totalDuration) {
          clearInterval(this.progressInterval);
          this.progressInterval = null;
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }
      }, 150);

      Compositor.play();
    } catch (err) {
      restorePreviewResolution();
      if (onError) onError(err.message || String(err));
    }
  },

  /**
   * Cancel ongoing export safely
   */
  cancelExport() {
    this.isExporting = false;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.recordedChunks = [];
    Compositor.pause();
    if (Compositor.orientation === 'landscape') {
      Compositor.setResolution(960, 540);
    } else {
      Compositor.setResolution(540, 960);
    }
  },
};
