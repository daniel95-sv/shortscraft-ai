/**
 * Server Client for bilalnaseer/free-video-maker Docker & MCP REST API
 * Provides seamless integration with the official Docker container / REST API on :3123
 * (Kokoro TTS + Whisper.cpp + Pexels + Remotion + FFmpeg + MCP SSE).
 */

export const ServerClient = {
  defaultUrl: 'http://localhost:3123',

  getBaseUrl() {
    return (localStorage.getItem('shortscraft_server_url') || this.defaultUrl).replace(/\/$/, '');
  },

  setBaseUrl(url) {
    const clean = (url || this.defaultUrl).trim().replace(/\/$/, '');
    localStorage.setItem('shortscraft_server_url', clean);
    return clean;
  },

  /**
   * Checks /health endpoint
   */
  async checkHealth(baseUrl = this.getBaseUrl()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return { ok: false, status: res.status };
      const data = await res.json();
      return { ok: data && data.status === 'ok', data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /**
   * Fetches Kokoro TTS voices and music tags catalog from the server
   */
  async syncCatalogs(baseUrl = this.getBaseUrl()) {
    try {
      const [voicesRes, musicRes] = await Promise.all([
        fetch(`${baseUrl}/api/voices`).catch(() => null),
        fetch(`${baseUrl}/api/music-tags`).catch(() => null),
      ]);

      const result = { voices: [], musicTags: [] };

      if (voicesRes && voicesRes.ok) {
        result.voices = await voicesRes.json();
      }
      if (musicRes && musicRes.ok) {
        result.musicTags = await musicRes.json();
      }

      return result;
    } catch (err) {
      console.warn('Failed to sync catalogs from Docker server:', err);
      return { voices: [], musicTags: [] };
    }
  },

  /**
   * Builds the standard JSON payload according to bilalnaseer/free-video-maker specification
   */
  buildPayload({ project, orientation = 'portrait', paddingBack = 1500, captionPos = 'bottom', captionColor = 'blue', voice = 'af_heart', music = 'chill', musicVolume = 'medium' }) {
    const jokerTerms = ['nature', 'globe', 'space', 'ocean'];

    const scenes = (project.scenes || []).map((s) => {
      let terms = s.searchTerms;
      if (!terms || !terms.length) {
        if (s.keyword) {
          terms = s.keyword.split(/\s+/).filter(Boolean);
        } else {
          terms = jokerTerms;
        }
      }
      return {
        text: s.text,
        searchTerms: terms,
      };
    });

    return {
      scenes,
      config: {
        paddingBack: Number(paddingBack) || 1500,
        music: music || 'chill',
        captionPosition: captionPos || 'bottom',
        captionBackgroundColor: captionColor || 'blue',
        voice: voice || 'af_heart',
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        musicVolume: musicVolume || 'medium',
      },
    };
  },

  /**
   * Generates a ready-to-run cURL command for terminal or MCP scripting
   */
  generateCurlCommand(baseUrl, payload) {
    const jsonStr = JSON.stringify(payload, null, 2);
    const escaped = jsonStr.replace(/'/g, "'\\''");
    return `curl --location '${baseUrl}/api/short-video' \\\n  --header 'Content-Type: application/json' \\\n  --data '${escaped}'`;
  },

  /**
   * Submits a video generation task to POST /api/short-video
   */
  async submitVideo(payload, baseUrl = this.getBaseUrl()) {
    const res = await fetch(`${baseUrl}/api/short-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Error en servidor (${res.status} ${res.statusText})`);
    }

    const data = await res.json();
    if (!data.videoId) {
      throw new Error('Respuesta inválida del servidor: falta videoId');
    }

    return data.videoId;
  },

  /**
   * Polls GET /api/short-video/:id/status until ready or failed
   */
  async pollVideoStatus(videoId, { onProgress, baseUrl = this.getBaseUrl(), abortSignal } = {}) {
    let status = 'processing';
    let pollCount = 0;

    while (status === 'processing') {
      if (abortSignal && abortSignal.aborted) {
        throw new Error('Generación cancelada por el usuario');
      }

      await new Promise((r) => setTimeout(r, 2500));
      pollCount++;

      const res = await fetch(`${baseUrl}/api/short-video/${videoId}/status`);
      if (!res.ok) {
        throw new Error(`Fallo al consultar estado HTTP ${res.status}`);
      }

      const data = await res.json();
      status = data.status;

      if (onProgress) {
        const estPercent = Math.min(95, 20 + pollCount * 6);
        onProgress({ status, percent: estPercent, details: data });
      }

      if (status === 'ready') {
        const videoUrl = `${baseUrl}/api/short-video/${videoId}`;
        return { videoId, videoUrl, status: 'ready', details: data };
      }

      if (status === 'failed') {
        throw new Error(data.error || 'El servidor falló al renderizar el video.');
      }
    }

    throw new Error(`Estado desconocido: ${status}`);
  },

  /**
   * Fetches list of all videos on the Docker server
   */
  async getVideos(baseUrl = this.getBaseUrl()) {
    try {
      const res = await fetch(`${baseUrl}/api/short-videos`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.videos) ? data.videos : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Deletes a video from the Docker server
   */
  async deleteVideo(videoId, baseUrl = this.getBaseUrl()) {
    try {
      const res = await fetch(`${baseUrl}/api/short-video/${videoId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },
};
