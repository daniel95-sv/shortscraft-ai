/**
 * Video Exporter & MediaRecorder Engine
 * Encodes the 1080x1920 60 FPS Canvas and Web Audio into a downloadable video file directly in the client browser.
 * Zero server rendering required! Zero hosting costs!
 */

import { Compositor } from './compositor.js';
import { AudioMixer } from './audio-mixer.js';

export const VideoExporter = {
  isExporting: false,
  mediaRecorder: null,
  recordedChunks: [],

  /**
   * Starts real-time in-browser export
   */
  async exportVideo({ onProgress, onComplete, onError }) {
    if (this.isExporting) return;
    if (!Compositor.project || Compositor.totalDurationSec <= 0) {
      if (onError) onError('No hay ningún proyecto cargado para exportar.');
      return;
    }

    this.isExporting = true;
    this.recordedChunks = [];

    try {
      // 1. Capture 60 FPS video stream from the canvas
      const canvasStream = Compositor.canvas.captureStream(60);

      // 2. Capture audio stream from AudioMixer
      const audioStream = AudioMixer.getMediaStream();

      // Combine video and audio tracks
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
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
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality 1080p
      };
      if (selectedMime) recorderOptions.mimeType = selectedMime;

      this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isExporting = false;
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

      // Rewind to 0 and start playback + recording
      Compositor.seek(0);
      this.mediaRecorder.start(100); // 100ms slices

      // Monitor progress
      const totalDuration = Compositor.totalDurationSec;
      const progressInterval = setInterval(() => {
        if (!this.isExporting) {
          clearInterval(progressInterval);
          return;
        }

        const current = Compositor.currentTimeSec;
        const percent = Math.min(100, Math.round((current / totalDuration) * 100));

        if (onProgress) {
          onProgress({ percent, currentSec: current, totalSec: totalDuration });
        }

        if (current >= totalDuration) {
          clearInterval(progressInterval);
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }
      }, 150);

      Compositor.play();
    } catch (err) {
      this.isExporting = false;
      console.error('Export failed:', err);
      if (onError) onError(err.message || 'Error al iniciar la grabación del video');
    }
  },

  cancelExport() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.isExporting = false;
    Compositor.pause();
  },
};
