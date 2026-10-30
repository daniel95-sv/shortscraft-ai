/**
 * ShortsCraft AI - Main Application Controller
 * Coordinates UI events, Dark2C Human-in-the-Loop scene editor,
 * AI generation, timeline simulator, in-browser video exporting,
 * and Docker/MCP REST server integration (bilalnaseer/free-video-maker).
 */

import { StorageManager } from './storage.js';
import { AIEngine, VIRAL_TEMPLATES } from './ai-engine.js';
import { TTSEngine } from './tts-engine.js';
import { MediaService } from './media-service.js';
import { CaptionAnimator } from './caption-animator.js';
import { AudioMixer } from './audio-mixer.js';
import { Compositor } from './compositor.js';
import { VideoExporter } from './recorder.js';
import { ServerClient } from './server-client.js';

class AppController {
  constructor() {
    this.currentProject = null;
    this.selectedTemplateKey = 'curiosities';
    this.selectedStyleKey = 'hormozi';
    this.settings = StorageManager.getSettings();
    this.apiKeys = StorageManager.getApiKeys();

    // Hybrid Engine & Orientation State
    this.engineMode = 'browser'; // 'browser' | 'server'
    this.orientation = 'portrait'; // 'portrait' | 'landscape'
    this.paddingBackMs = 1500;
    this.captionPosition = 'bottom';
    this.serverAbortController = null;
    this.generatedVideos = [];
  }

  async init() {
    // 1. Initialize Canvas Compositor
    const canvas = document.getElementById('shortsCanvas');
    Compositor.init(canvas);
    Compositor.captionStyle = this.settings.captionStyle || 'hormozi';
    Compositor.fontFamily = this.settings.fontFamily || 'Anton';
    Compositor.fontSize = this.settings.fontSize || 58;
    Compositor.bgType = this.settings.bgMotion || 'cyber-grid';
    Compositor.showProgressBar = this.settings.showProgressBar ?? true;
    Compositor.paddingBackSec = this.paddingBackMs / 1000;
    Compositor.setOrientation(this.orientation);

    // TTS & Voice engine setup
    Compositor.ttsEngine = this.settings.ttsEngine || 'webspeech';
    Compositor.elevenLabsApiKey = this.apiKeys.elevenlabs || '';
    Compositor.elevenLabsVoiceId = this.settings.elevenLabsVoiceId || 'CwhRBWXzGAHq8TQ4Fs17';
    Compositor.speechRate = this.settings.speechRate || 1.15;

    // 2. Load Speech Voices
    await this.initVoices();

    // 3. Render UI Components
    this.renderTemplateCards();
    this.renderSubtitleStyleCards();
    this.bindEvents();
    this.bindCompositorListeners();
    this.bindFontSelector();
    this.bindMobileNav();
    this.initPWA();

    // 4. Load saved videos history
    this.loadVideosHistory();

    // 5. Load initial starter project so preview is immediately alive
    this.loadInitialProject();

    // 6. Restore saved server URL into input if user previously configured one
    const savedServerUrl = ServerClient.getBaseUrl();
    const serverInput = document.getElementById('serverUrlInput');
    if (serverInput && savedServerUrl) {
      serverInput.value = savedServerUrl;
    }
  }

  async initVoices() {
    const voiceSelect = document.getElementById('voiceSelect');
    const elevenSelect = document.getElementById('elevenLabsVoiceSelect');
    const ttsEngineSelect = document.getElementById('ttsEngineSelect');
    const webGroup = document.getElementById('webSpeechVoiceGroup');
    const elevenGroup = document.getElementById('elevenLabsVoiceGroup');
    const engineBadge = document.getElementById('ttsEngineBadge');

    // 1. Sync engine selector
    const currentEngine = this.settings.ttsEngine || 'webspeech';
    if (ttsEngineSelect) {
      ttsEngineSelect.value = currentEngine;
    }
    if (webGroup && elevenGroup) {
      webGroup.style.display = currentEngine === 'webspeech' ? 'block' : 'none';
      elevenGroup.style.display = currentEngine === 'elevenlabs' ? 'block' : 'none';
    }
    if (engineBadge) {
      engineBadge.textContent = currentEngine === 'elevenlabs' ? 'Voces Hiperrealistas Activas' : '100% Gratis en Navegador';
      engineBadge.style.color = currentEngine === 'elevenlabs' ? 'var(--accent-purple)' : 'var(--accent-cyan)';
    }

    // 2. Load Web Speech voices
    if (voiceSelect) {
      const voices = await TTSEngine.loadVoices();
      voiceSelect.innerHTML = '';
      const sorted = [...voices].sort((a, b) => {
        const aIsEs = a.lang.startsWith('es');
        const bIsEs = b.lang.startsWith('es');
        if (aIsEs && !bIsEs) return -1;
        if (!aIsEs && bIsEs) return 1;
        return a.name.localeCompare(b.name);
      });

      sorted.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})${v.default ? ' ★' : ''}`;
        if (this.settings.defaultVoice === v.name || (v.lang.startsWith('es') && !this.settings.defaultVoice)) {
          opt.selected = true;
          Compositor.voiceName = v.name;
        }
        voiceSelect.appendChild(opt);
      });
    }

    // 3. Load ElevenLabs voices
    if (elevenSelect) {
      const elevenVoices = await TTSEngine.loadElevenLabsVoices(this.apiKeys.elevenlabs);
      elevenSelect.innerHTML = '';
      elevenVoices.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.voice_id;
        opt.textContent = `${v.name}`;
        if (this.settings.elevenLabsVoiceId === v.voice_id) {
          opt.selected = true;
          Compositor.elevenLabsVoiceId = v.voice_id;
        }
        elevenSelect.appendChild(opt);
      });
    }
  }

  loadInitialProject() {
    const starter = VIRAL_TEMPLATES.curiosities.generator('el Espacio y la Mente');
    this.setProject(starter);
  }

  setProject(project) {
    this.currentProject = project;
    StorageManager.saveCurrentProject(project);

    // Sync compositor
    Compositor.loadProject(project);

    // Sync UI elements
    this.renderSceneCards();
    this.updateSceneDisplay(0);
    this.updateMetadataTab();
    this.updateTimeDisplay(0, Compositor.totalDurationSec);
    this.updatePayloadPreview();

    // Sync background dropdown and music mood
    if (project.musicMood) {
      const moodSelect = document.getElementById('musicMoodSelect');
      if (moodSelect) moodSelect.value = project.musicMood;
    }
  }

  updateSceneDisplay(sceneIndex = Compositor.currentSceneIndex) {
    const display = document.getElementById('currentSceneDisplay');
    if (!display) return;
    const total = this.currentProject?.scenes?.length || 0;
    if (total === 0) {
      display.textContent = 'Escena 0/0';
    } else {
      const current = Math.min(Math.max(1, (sceneIndex ?? 0) + 1), total);
      display.textContent = `Escena ${current}/${total}`;
    }
  }

  recalibrateSceneDurations() {
    if (!this.currentProject || !this.currentProject.scenes) return;
    this.currentProject.scenes.forEach((scene) => {
      const estDuration = TTSEngine.estimateDuration(scene.text, Compositor.speechRate);
      scene.durationSec = estDuration;
      scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
    });
    Compositor.loadProject(this.currentProject);
    this.renderSceneCards();
    this.updateSceneDisplay(Compositor.currentSceneIndex);
    this.updateTimeDisplay(Compositor.currentTimeSec, Compositor.totalDurationSec);
  }

  renderTemplateCards() {
    const container = document.getElementById('templateGrid');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(VIRAL_TEMPLATES).forEach(([key, tpl]) => {
      const card = document.createElement('div');
      card.className = `template-card ${key === this.selectedTemplateKey ? 'active' : ''}`;
      card.innerHTML = `
        <div class="template-title">${tpl.name}</div>
        <div class="template-desc">Fórmula de alta retención para Shorts, TikTok y Reels.</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.template-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedTemplateKey = key;
      });
      container.appendChild(card);
    });
  }

  renderSubtitleStyleCards() {
    const container = document.getElementById('subtitleStylesGrid');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(CaptionAnimator.styles).forEach(([key, style]) => {
      const card = document.createElement('div');
      card.className = `style-card ${key === Compositor.captionStyle ? 'active' : ''}`;
      card.innerHTML = `
        <div class="style-preview-box" style="font-family: ${style.fontFamily}; font-weight: ${style.fontWeight};">
          <span style="color: ${style.textColor};">VIRAL </span>
          <span style="color: ${style.activeColor}; font-weight: 900;">SHORT</span>
        </div>
        <div style="font-size: 0.82rem; font-weight: 700; color: #f8fafc;">${style.name}</div>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.style-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        Compositor.captionStyle = key;
        this.settings.captionStyle = key;
        StorageManager.saveSettings(this.settings);
        Compositor.requestRender();
        this.updatePayloadPreview();
      });
      container.appendChild(card);
    });
  }

  /**
   * Dark2C Human-in-the-Loop Scene Editor
   * Allows live script tweaking, duration adjustments, scene reordering, and per-scene video swapping
   */
  renderSceneCards() {
    const container = document.getElementById('scenesContainer');
    if (!container || !this.currentProject) return;
    container.innerHTML = '';
    this.updateSceneDisplay(Compositor.currentSceneIndex);

    const totalScenes = this.currentProject.scenes.length;

    this.currentProject.scenes.forEach((scene, idx) => {
      const card = document.createElement('div');
      card.className = `scene-card ${idx === Compositor.currentSceneIndex ? 'active-scene' : ''}`;
      card.dataset.sceneIndex = idx;

      const termsList = scene.searchTerms && scene.searchTerms.length
        ? scene.searchTerms.join(', ')
        : (scene.keyword || 'cosmos, galaxy');

      card.innerHTML = `
        <div class="scene-header">
          <div class="scene-badge-row">
            <span class="scene-badge">Escena #${idx + 1}</span>
            <div class="scene-duration-input">
              <label>Duración:</label>
              <input type="number" step="0.5" min="1.5" max="15" value="${scene.durationSec}" class="input-duration scene-duration-field">
              <span>seg</span>
            </div>
          </div>
          <div class="scene-actions">
            ${idx > 0 ? `<button class="btn-move-scene btn-move-up" title="Mover escena arriba"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg></button>` : ''}
            ${idx < totalScenes - 1 ? `<button class="btn-move-scene btn-move-down" title="Mover escena abajo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>` : ''}
            <button class="btn-step btn-preview-scene" title="Previsualizar esta escena">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
            <button class="btn-step btn-delete-scene" title="Eliminar escena">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <textarea class="scene-textarea" rows="2" placeholder="Escribe la narración para esta escena...">${scene.text}</textarea>

        <div class="scene-terms-row">
          <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">Pexels:</span>
          <input type="text" class="scene-terms-input" value="${termsList}" placeholder="ej. space, planet, stars">
          <button class="btn-step btn-fetch-scene-broll" title="Buscar clip Pexels para esta escena">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </div>

        <div class="scene-footer">
          <div class="scene-media-status">
            ${MediaService.getCustomMedia(scene.id) ? '<span style="color: #10b981; font-size: 0.75rem; font-weight: 700;">✓ Clip Activo</span>' : '<span style="color: var(--text-muted); font-size: 0.75rem;">Fondo Procedural HD</span>'}
          </div>

          <div class="scene-media-controls">
            <label class="btn-media-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Subir Clip</span>
              <input type="file" accept="video/*,image/*" style="display: none;" class="scene-file-input">
            </label>
          </div>
        </div>
      `;

      // Live text editing
      const textarea = card.querySelector('.scene-textarea');
      textarea.addEventListener('input', (e) => {
        scene.text = e.target.value;
        scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
        Compositor.requestRender();
        this.updatePayloadPreview();
      });

      textarea.addEventListener('change', (e) => {
        scene.text = e.target.value;
        const autoDuration = TTSEngine.estimateDuration(scene.text, Compositor.speechRate);
        scene.durationSec = autoDuration;
        scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
        const durInput = card.querySelector('.scene-duration-field');
        if (durInput) durInput.value = autoDuration;
        Compositor.loadProject(this.currentProject);
        this.updateTimeDisplay(Compositor.currentTimeSec, Compositor.totalDurationSec);
        Compositor.requestRender();
      });

      // Search terms editing
      const termsInput = card.querySelector('.scene-terms-input');
      termsInput.addEventListener('input', (e) => {
        const raw = e.target.value;
        const splitted = raw.split(',').map((t) => t.trim()).filter(Boolean);
        scene.searchTerms = splitted.length ? splitted : ['nature'];
        scene.keyword = splitted.join(' ');
        this.updatePayloadPreview();
      });

      // Fetch Pexels B-Roll for single scene
      const btnFetchSingle = card.querySelector('.btn-fetch-scene-broll');
      btnFetchSingle.addEventListener('click', async () => {
        if (!this.apiKeys.pexels) {
          document.getElementById('btnSettings').click();
          alert('Por favor introduce tu Pexels API Key gratuita en Configuración para buscar videos en vivo.');
          return;
        }
        btnFetchSingle.innerHTML = '<span style="font-size: 0.7rem;">...</span>';
        const media = await MediaService.fetchPexelsVideoForTerms(scene.searchTerms, this.orientation, this.apiKeys.pexels);
        btnFetchSingle.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
        if (media) {
          MediaService.setMediaForScene(scene.id, media);
          this.renderSceneCards();
          Compositor.seek(Compositor.currentTimeSec);
        } else {
          alert('No se encontraron clips para los términos especificados.');
        }
      });

      // Move scene UP
      const btnUp = card.querySelector('.btn-move-up');
      if (btnUp) {
        btnUp.addEventListener('click', () => this.moveScene(idx, -1));
      }

      // Move scene DOWN
      const btnDown = card.querySelector('.btn-move-down');
      if (btnDown) {
        btnDown.addEventListener('click', () => this.moveScene(idx, 1));
      }

      // Duration editing
      const durationField = card.querySelector('.scene-duration-field');
      durationField.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 3.5;
        scene.durationSec = Math.max(1.5, Math.min(val, 20));
        scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
        Compositor.loadProject(this.currentProject);
        this.updateTimeDisplay(Compositor.currentTimeSec, Compositor.totalDurationSec);
        Compositor.requestRender();
        this.updatePayloadPreview();
      });

      // Preview single scene
      const btnPreview = card.querySelector('.btn-preview-scene');
      btnPreview.addEventListener('click', () => {
        const startTime = Compositor.sceneStartTimes[idx] || 0;
        Compositor.seek(startTime);
        Compositor.play();
      });

      // Delete scene
      const btnDelete = card.querySelector('.btn-delete-scene');
      btnDelete.addEventListener('click', () => {
        if (this.currentProject.scenes.length <= 1) {
          alert('El video debe tener al menos una escena.');
          return;
        }
        this.currentProject.scenes.splice(idx, 1);
        Compositor.loadProject(this.currentProject);
        this.renderSceneCards();
        this.updatePayloadPreview();
      });

      // Upload custom clip for this scene
      const fileInput = card.querySelector('.scene-file-input');
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          MediaService.setCustomMediaForScene(scene.id, file);
          this.renderSceneCards();
          Compositor.seek(Compositor.currentTimeSec);
        }
      });

      container.appendChild(card);
    });
  }

  moveScene(idx, direction) {
    const target = idx + direction;
    if (!this.currentProject || target < 0 || target >= this.currentProject.scenes.length) return;

    const temp = this.currentProject.scenes[idx];
    this.currentProject.scenes[idx] = this.currentProject.scenes[target];
    this.currentProject.scenes[target] = temp;

    Compositor.loadProject(this.currentProject);
    this.renderSceneCards();
    this.updatePayloadPreview();
  }

  updateMetadataTab() {
    if (!this.currentProject) return;

    const titleInput = document.getElementById('metaTitleInput');
    if (titleInput) titleInput.value = this.currentProject.title || '';

    const tagsContainer = document.getElementById('metaTagsContainer');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      (this.currentProject.hashtags || []).forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'meta-chip';
        chip.textContent = tag;
        tagsContainer.appendChild(chip);
      });
    }

    const descTextarea = document.getElementById('metaDescTextarea');
    if (descTextarea) descTextarea.value = this.currentProject.description || '';
  }

  updatePayloadPreview() {
    if (!this.currentProject) return;
    const payloadElem = document.getElementById('jsonPayloadPreview');
    if (!payloadElem) return;

    const payload = ServerClient.buildPayload({
      project: this.currentProject,
      orientation: this.orientation,
      paddingBack: this.paddingBackMs,
      captionPos: this.captionPosition,
      captionColor: this.settings.highlightColor || 'blue',
      voice: 'af_heart',
      music: this.currentProject.musicMood || 'chill',
      musicVolume: 'medium',
    });

    payloadElem.textContent = JSON.stringify(payload, null, 2);
  }

  bindCompositorListeners() {
    const playPauseBtn = document.getElementById('btnPlayPause');
    const timelineSlider = document.getElementById('timelineSlider');
    const phoneScreen = document.getElementById('phoneScreen');

    Compositor.onTimeUpdate = (currentSec, totalSec) => {
      this.updateTimeDisplay(currentSec, totalSec);
      if (totalSec > 0 && timelineSlider) {
        timelineSlider.value = (currentSec / totalSec) * 100;
      }
    };

    Compositor.onSceneChange = (sceneIndex) => {
      document.querySelectorAll('.scene-card').forEach((card, idx) => {
        card.classList.toggle('active-scene', idx === sceneIndex);
      });
      this.updateSceneDisplay(sceneIndex);
    };

    Compositor.onPlaybackEnd = () => {
      this.updatePlayPauseButton(false);
    };

    Compositor.onPlayStateChange = (isPlaying) => {
      this.updatePlayPauseButton(isPlaying);
    };

    // Phone screen click to toggle play (only when clicking canvas/video, not controls)
    phoneScreen?.addEventListener('click', (e) => {
      if (e.target.closest('#timelineSlider, .timeline-controls-bar, button, input, label')) {
        return;
      }
      this.togglePlayPause();
    });

    // Timeline Slider input
    timelineSlider?.addEventListener('input', (e) => {
      const frac = parseFloat(e.target.value) / 100;
      Compositor.seek(frac * Compositor.totalDurationSec);
    });

    // Main Play/Pause Button
    playPauseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlayPause();
    });

    // Spacebar to play/pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.togglePlayPause();
      }
    });
  }

  togglePlayPause() {
    if (Compositor.isPlaying) {
      Compositor.pause();
    } else {
      // Hide server video player if visible
      const serverPlayer = document.getElementById('serverVideoPlayer');
      if (serverPlayer && !serverPlayer.classList.contains('hidden-player')) {
        serverPlayer.style.display = 'none';
        document.getElementById('shortsCanvas').style.display = 'block';
      }
      Compositor.play();
    }
  }

  updatePlayPauseButton(isPlaying) {
    const playIconSvg = document.getElementById('playIconSvg');
    const phoneScreen = document.getElementById('phoneScreen');
    if (phoneScreen) {
      phoneScreen.classList.toggle('is-playing', isPlaying);
    }
    if (!playIconSvg) return;

    if (isPlaying) {
      playIconSvg.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    } else {
      playIconSvg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    }
  }

  updateTimeDisplay(currentSec, totalSec) {
    const curElem = document.getElementById('currentTimeDisplay');
    const totElem = document.getElementById('totalTimeDisplay');

    const fmt = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    if (curElem) curElem.textContent = fmt(currentSec);
    if (totElem) totElem.textContent = fmt(totalSec);
  }

  // --- ENGINE MODES & ORIENTATION ---
  setEngineMode(mode) {
    this.engineMode = mode;
    const bBtn = document.getElementById('btnModeBrowser');
    const sBtn = document.getElementById('btnModeServer');
    const badge = document.getElementById('connectionBadge');
    const exportBtnText = document.getElementById('btnExportVideoText');

    if (mode === 'browser') {
      if (bBtn) bBtn.classList.add('active');
      if (sBtn) sBtn.classList.remove('active');
      if (badge) {
        badge.textContent = '● Web Engine Activo';
        badge.className = 'brand-badge badge-browser';
      }
      if (exportBtnText) exportBtnText.textContent = 'Descargar Video Short MP4 (Navegador)';

      // Restore canvas display
      const player = document.getElementById('serverVideoPlayer');
      const canvas = document.getElementById('shortsCanvas');
      if (player) player.style.display = 'none';
      if (canvas) canvas.style.display = 'block';
    } else {
      const serverUrl = ServerClient.getBaseUrl();
      if (!serverUrl) {
        this.showToast('Configura la URL de tu servidor en la pestaña "API & Servidor" para habilitar el modo remoto.', 'info');
        this.setEngineMode('browser');
        return;
      }

      if (sBtn) sBtn.classList.add('active');
      if (bBtn) bBtn.classList.remove('active');
      if (badge) {
        badge.textContent = '● Modo Servidor Externo';
        badge.className = 'brand-badge badge-server-online';
      }
      if (exportBtnText) exportBtnText.textContent = 'Renderizar y Descargar con Servidor';

      // Trigger server check only if URL is explicitly configured
      this.checkServerHealthUI();
    }
    this.updatePayloadPreview();
  }

  async checkServerHealthUI() {
    const input = document.getElementById('serverUrlInput');
    const url = (input?.value || '').trim();
    const badge = document.getElementById('serverStatusBadge');

    if (!url) {
      ServerClient.setBaseUrl('');
      if (badge) {
        badge.textContent = '● 100% Autónomo en Navegador';
        badge.className = 'brand-badge badge-browser';
      }
      this.showToast('Ingresa la URL de tu servidor o VPS para probar la conexión.', 'info');
      return false;
    }

    ServerClient.setBaseUrl(url);

    if (badge) {
      badge.textContent = '● Verificando...';
      badge.className = 'brand-badge';
    }

    const health = await ServerClient.checkHealth(url);
    if (health.ok) {
      if (badge) {
        badge.textContent = '● Servidor Conectado';
        badge.className = 'brand-badge badge-server-online';
      }
      this.showToast('¡Conexión exitosa con el servidor remoto!', 'success');
      return true;
    } else {
      if (badge) {
        badge.textContent = '● Servidor No Disponible';
        badge.className = 'brand-badge badge-server-offline';
      }
      this.showToast(`No se pudo conectar a ${url}. Verifica que esté activo y permita solicitudes CORS.`, 'error');
      return false;
    }
  }

  toggleOrientation() {
    this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
    const isLand = this.orientation === 'landscape';

    // Update Compositor resolution
    Compositor.setOrientation(this.orientation);

    // Update DOM simulator classes
    const mockup = document.getElementById('phoneMockupContainer');
    const timeline = document.getElementById('timelineCardContainer');
    const exportPanel = document.getElementById('exportPanelContainer');
    const historyCard = document.getElementById('videosHistoryCard');

    if (mockup) mockup.classList.toggle('landscape', isLand);
    if (timeline) timeline.classList.toggle('landscape', isLand);
    if (exportPanel) exportPanel.classList.toggle('landscape', isLand);
    if (historyCard) historyCard.classList.toggle('landscape', isLand);

    // Update Button Labels
    const icon = document.getElementById('orientationIcon');
    const text = document.getElementById('orientationText');
    if (icon) icon.textContent = isLand ? '🖥️' : '📱';
    if (text) text.textContent = isLand ? '16:9' : '9:16';

    if (isLand) {
      this.showToast('🖥️ Formato 16:9 activo: los nuevos guiones se calibrarán para ~2 minutos (18-22 escenas).', 'info', 4000);
    } else {
      this.showToast('📱 Formato 9:16 activo: los nuevos guiones se calibrarán para ~1 minuto (10-12 escenas para Shorts).', 'info', 4000);
    }

    this.updatePayloadPreview();
  }

  // --- AUTOMATED PEXELS B-ROLL ---
  async autoFetchPexelsBroll() {
    if (!this.apiKeys.pexels) {
      document.getElementById('btnSettings').click();
      alert('Por favor introduce tu Pexels API Key gratuita en Configuración para descargar clips B-Roll automáticos.');
      return;
    }

    const btn = document.getElementById('btnAutoFetchBroll');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Descargando B-Roll...</span>';

    try {
      await MediaService.autoFetchBrollForProject(
        this.currentProject,
        this.orientation,
        this.apiKeys.pexels,
        ({ current, total }) => {
          btn.innerHTML = `<span>B-Roll ${current}/${total}...</span>`;
        }
      );
      this.renderSceneCards();
      Compositor.seek(Compositor.currentTimeSec);
      alert('¡Clips de B-Roll de Pexels descargados y aplicados a todas las escenas con éxito!');
    } catch (err) {
      alert(`Error al buscar videos en Pexels: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // --- GENERATED VIDEOS HISTORY ---
  loadVideosHistory() {
    try {
      const raw = localStorage.getItem('shortscraft_videos_history');
      this.generatedVideos = raw ? JSON.parse(raw) : [];
      this.renderVideosHistory();
    } catch (e) {
      this.generatedVideos = [];
    }
  }

  saveVideosHistory() {
    try {
      localStorage.setItem('shortscraft_videos_history', JSON.stringify(this.generatedVideos.slice(0, 15)));
    } catch (e) {}
  }

  addGeneratedVideo(item) {
    this.generatedVideos.unshift(item);
    this.saveVideosHistory();
    this.renderVideosHistory();
  }

  deleteGeneratedVideo(id, mode) {
    if (mode === 'server') {
      ServerClient.deleteVideo(id);
    }
    this.generatedVideos = this.generatedVideos.filter((v) => v.id !== id);
    this.saveVideosHistory();
    this.renderVideosHistory();
  }

  renderVideosHistory() {
    const list = document.getElementById('videosHistoryList');
    const badge = document.getElementById('videosCountBadge');
    if (!list) return;

    if (badge) badge.textContent = this.generatedVideos.length;

    if (this.generatedVideos.length === 0) {
      list.innerHTML = `<div class="history-empty">Aún no hay videos generados en esta sesión. ¡Haz clic en "Descargar Video" para crear el primero!</div>`;
      return;
    }

    list.innerHTML = this.generatedVideos.map((v) => `
      <div class="history-item">
        <div class="history-info">
          <div class="history-name">${v.title || v.id}</div>
          <div class="history-meta">
            <span class="history-format-tag">${v.format || 'MP4'}</span>
            <span>${v.mode === 'browser' ? '⚡ Navegador' : '🐳 Docker'}</span>
            <span>• ${v.orientation || '9:16'}</span>
            <span>• ${v.createdAt}</span>
          </div>
        </div>
        <div class="history-actions">
          <a href="${v.url}" download="${v.filename || `video_${v.id}.mp4`}" class="btn-history-dl" target="_blank" title="Descargar archivo">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Bajar</span>
          </a>
          <button class="btn-history-del" onclick="window.shortscraftApp.deleteGeneratedVideo('${v.id}', '${v.mode}')" title="Eliminar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // --- DOCKER SERVER EXPORT PIPELINE ---
  async exportVideoViaServer() {
    const baseUrl = ServerClient.getBaseUrl();
    if (!baseUrl) {
      this.showToast('No hay servidor externo configurado. Exportando con el motor autónomo del navegador...', 'info', 4000);
      this.setEngineMode('browser');
      document.getElementById('btnExportVideo')?.click();
      return;
    }

    const exportModal = document.getElementById('exportModal');
    const fillBar = document.getElementById('exportProgressFill');
    const percentDisplay = document.getElementById('exportProgressPercent');
    const timeDisplay = document.getElementById('exportProgressTime');
    const successBox = document.getElementById('exportSuccessBox');
    const btnDownloadAgain = document.getElementById('btnDownloadAgain');

    exportModal.classList.add('open');
    successBox.style.display = 'none';
    fillBar.style.width = '10%';
    percentDisplay.textContent = '10%';
    timeDisplay.textContent = 'Enviando a POST /api/short-video...';

    const payload = ServerClient.buildPayload({
      project: this.currentProject,
      orientation: this.orientation,
      paddingBack: this.paddingBackMs,
      captionPos: this.captionPosition,
      captionColor: this.settings.highlightColor || 'blue',
      voice: 'af_heart',
      music: this.currentProject.musicMood || 'chill',
      musicVolume: 'medium',
    });

    try {
      this.serverAbortController = new AbortController();
      const videoId = await ServerClient.submitVideo(payload);

      fillBar.style.width = '25%';
      percentDisplay.textContent = '25%';
      timeDisplay.textContent = `Procesando con Remotion + Whisper (${videoId})...`;

      const result = await ServerClient.pollVideoStatus(videoId, {
        onProgress: ({ percent, status }) => {
          fillBar.style.width = `${percent}%`;
          percentDisplay.textContent = `${percent}%`;
          timeDisplay.textContent = `Servidor: ${status}...`;
        },
        abortSignal: this.serverAbortController.signal,
      });

      fillBar.style.width = '100%';
      percentDisplay.textContent = '100%';
      timeDisplay.textContent = '¡Renderizado completado en el servidor!';

      // Download file
      const filename = `${(this.currentProject.title || 'ShortsCraft_Server')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30)}_${videoId}.mp4`;

      const a = document.createElement('a');
      a.href = result.videoUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Play video in player simulator
      const serverPlayer = document.getElementById('serverVideoPlayer');
      if (serverPlayer) {
        document.getElementById('shortsCanvas').style.display = 'none';
        serverPlayer.style.display = 'block';
        serverPlayer.src = result.videoUrl;
        serverPlayer.play().catch(() => {});
      }

      // Add to session history
      this.addGeneratedVideo({
        id: videoId,
        title: this.currentProject.title || 'Video Docker Remotion',
        format: 'MP4',
        mode: 'server',
        url: result.videoUrl,
        filename,
        orientation: this.orientation === 'landscape' ? '16:9' : '9:16',
        createdAt: new Date().toLocaleTimeString(),
      });

      // Show success modal
      successBox.style.display = 'flex';
      btnDownloadAgain.href = result.videoUrl;
      btnDownloadAgain.download = filename;
    } catch (err) {
      this.showToast(`Error en el servidor: ${err.message}`, 'error', 6000);
      exportModal.classList.remove('open');
    } finally {
      this.serverAbortController = null;
    }
  }

  bindEvents() {
    // 1. Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTabId = btn.dataset.tab;
        const target = document.getElementById(targetTabId);
        if (target) target.classList.add('active');
      });
    });

    // 2. Engine Mode Toggle
    document.getElementById('btnModeBrowser')?.addEventListener('click', () => this.setEngineMode('browser'));
    document.getElementById('btnModeServer')?.addEventListener('click', () => this.setEngineMode('server'));

    // 3. Orientation Toggle
    document.getElementById('btnToggleOrientation')?.addEventListener('click', () => this.toggleOrientation());

    // 4. Docker Guide Modal
    const dockerModal = document.getElementById('dockerMcpModal');
    document.getElementById('btnOpenDockerModal')?.addEventListener('click', () => dockerModal.classList.add('open'));
    document.getElementById('btnCloseDockerModal')?.addEventListener('click', () => dockerModal.classList.remove('open'));
    dockerModal?.addEventListener('click', (e) => {
      if (e.target === dockerModal) dockerModal.classList.remove('open');
    });

    // 5. API Tab controls: Health check & Catalog sync
    document.getElementById('btnCheckHealth')?.addEventListener('click', async () => {
      await this.checkServerHealthUI();
    });

    document.getElementById('btnSyncServerCatalogs')?.addEventListener('click', async () => {
      const baseUrl = ServerClient.getBaseUrl();
      if (!baseUrl) {
        this.showToast('Primero ingresa y prueba la URL de tu servidor.', 'info');
        return;
      }
      const catalogs = await ServerClient.syncCatalogs(baseUrl);
      if (catalogs.voices.length) {
        this.showToast(`¡Catálogo sincronizado! ${catalogs.voices.length} voces y ${catalogs.musicTags.length} géneros.`, 'success');
      } else {
        this.showToast('No se pudieron obtener catálogos del servidor remoto.', 'error');
      }
    });

    // 6. Copy Payload & cURL Buttons
    document.getElementById('btnCopyPayloadJson')?.addEventListener('click', (e) => {
      const text = document.getElementById('jsonPayloadPreview').textContent;
      navigator.clipboard.writeText(text);
      const btn = e.target;
      btn.textContent = '¡Copiado!';
      setTimeout(() => (btn.textContent = 'Copiar JSON'), 1500);
    });

    document.getElementById('btnCopyCurlCmd')?.addEventListener('click', (e) => {
      const payload = ServerClient.buildPayload({
        project: this.currentProject,
        orientation: this.orientation,
        paddingBack: this.paddingBackMs,
        captionPos: this.captionPosition,
        captionColor: this.settings.highlightColor || 'blue',
      });
      const cmd = ServerClient.generateCurlCommand(ServerClient.getBaseUrl(), payload);
      navigator.clipboard.writeText(cmd);
      const btn = e.target;
      btn.textContent = '¡Copiado!';
      setTimeout(() => (btn.textContent = 'Copiar cURL'), 1500);
    });

    // 7. Auto Fetch B-Roll from Pexels button
    document.getElementById('btnAutoFetchBroll')?.addEventListener('click', () => this.autoFetchPexelsBroll());

    // 8. Refresh videos history
    document.getElementById('btnRefreshVideos')?.addEventListener('click', async () => {
      if (this.engineMode === 'server') {
        const srvVideos = await ServerClient.getVideos();
        if (srvVideos.length) {
          srvVideos.forEach((sv) => {
            if (!this.generatedVideos.some((v) => v.id === sv.id)) {
              this.generatedVideos.push({
                id: sv.id,
                title: `Video Docker ${sv.id}`,
                format: 'MP4',
                mode: 'server',
                url: `${ServerClient.getBaseUrl()}/api/short-video/${sv.id}`,
                orientation: '9:16',
                createdAt: 'Servidor Docker',
              });
            }
          });
          this.saveVideosHistory();
        }
      }
      this.renderVideosHistory();
    });

    // 9. Padding Back & Caption Position controls
    const paddingRange = document.getElementById('paddingBackRange');
    const paddingDisplay = document.getElementById('paddingBackDisplay');
    paddingRange?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.paddingBackMs = val;
      Compositor.paddingBackSec = val / 1000;
      if (paddingDisplay) paddingDisplay.textContent = `${val} ms`;
      if (this.currentProject) Compositor.loadProject(this.currentProject);
      this.updatePayloadPreview();
    });

    const captionPosSelect = document.getElementById('captionPosSelect');
    captionPosSelect?.addEventListener('change', (e) => {
      this.captionPosition = e.target.value;
      if (e.target.value === 'bottom') Compositor.captionYPercent = 70;
      if (e.target.value === 'center') Compositor.captionYPercent = 50;
      if (e.target.value === 'top') Compositor.captionYPercent = 25;
      Compositor.requestRender();
      this.updatePayloadPreview();
    });

    // 10. Generate with AI Button
    const btnGenerate = document.getElementById('btnGenerateScript');
    btnGenerate?.addEventListener('click', async () => {
      if (this.isGeneratingScript) return;

      const topic = document.getElementById('topicInput').value.trim();
      let provider = document.getElementById('aiProviderSelect').value;
      const language = document.getElementById('languageSelect').value;

      // Handle OpenAI absence gracefully without disrupting user
      if (provider === 'openai' && !this.apiKeys.openai) {
        this.showToast('ℹ️ No dispones de una clave de OpenAI. Usando Groq (gratis y ultra rápido)...', 'info', 4500);
        provider = 'groq';
        const sel = document.getElementById('aiProviderSelect');
        if (sel) sel.value = 'groq';
      }

      let apiKey = '';
      if (provider === 'gemini') apiKey = this.apiKeys.gemini;
      if (provider === 'openai') apiKey = this.apiKeys.openai;
      if (provider === 'groq') apiKey = this.apiKeys.groq;

      this.isGeneratingScript = true;
      btnGenerate.disabled = true;
      btnGenerate.classList.add('btn-generating');

      const progressBox = document.getElementById('aiGenerationProgressBox');
      const progressText = document.getElementById('aiProgressStatusText');
      const progressBar = document.getElementById('aiProgressBarFill');

      if (progressBox) progressBox.style.display = 'flex';
      if (progressBar) progressBar.style.width = '25%';
      if (progressText) progressText.textContent = '🧠 Conectando con IA y analizando el tema...';

      btnGenerate.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        <span>Creando Guión & Sincronizando...</span>
      `;

      const stepTimer1 = setTimeout(() => {
        if (progressBar) progressBar.style.width = '60%';
        if (progressText) progressText.textContent = '✨ Escribiendo guión y ganchos de alta retención...';
      }, 800);

      const stepTimer2 = setTimeout(() => {
        if (progressBar) progressBar.style.width = '85%';
        if (progressText) progressText.textContent = '⏱️ Calibrando cadencia de voz y palabras clave...';
      }, 2000);

      try {
        const generated = await AIEngine.generateScript({
          topic,
          templateKey: this.selectedTemplateKey,
          provider,
          apiKey,
          language,
          orientation: this.orientation || Compositor.orientation || 'portrait',
        });

        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '🎬 Integrando escenas en el estudio...';

        this.setProject(generated);

        if (generated.fallbackNotice) {
          this.showToast(generated.fallbackNotice, 'warning', 6000);
        } else {
          this.showToast('¡Guión y escenas sincronizadas con éxito!', 'success');
        }

        // On mobile, switch smoothly to the live studio preview
        if (window.innerWidth <= 768) {
          this.switchMobileView('studio');
        } else {
          // Switch automatically to Scene Editor tab so user sees the generated cards
          const scenesTabBtn = document.querySelector('[data-tab="tab-scenes"]');
          if (scenesTabBtn) scenesTabBtn.click();
        }
      } catch (err) {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        this.showToast(`Error al generar guión: ${err.message}`, 'error', 5000);
      } finally {
        this.isGeneratingScript = false;
        btnGenerate.disabled = false;
        btnGenerate.classList.remove('btn-generating');
        if (progressBox) {
          setTimeout(() => {
            progressBox.style.display = 'none';
          }, 800);
        }
        btnGenerate.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
          <span>Crear Guión & Generar Short</span>
        `;
      }
    });

    // 11. Add Scene Button
    const btnAddScene = document.getElementById('btnAddScene');
    btnAddScene?.addEventListener('click', () => {
      if (!this.currentProject) return;
      const newId = this.currentProject.scenes.length + 1;
      const defaultText = 'Nueva escena editable. Añade tu texto aquí.';
      const autoDuration = TTSEngine.estimateDuration(defaultText, Compositor.speechRate);
      this.currentProject.scenes.push({
        id: newId,
        text: defaultText,
        keyword: 'nature ocean',
        searchTerms: ['nature', 'ocean'],
        durationSec: autoDuration,
        words: TTSEngine.calculateWordTimestamps(defaultText, autoDuration),
      });
      Compositor.loadProject(this.currentProject);
      this.renderSceneCards();
      this.updateSceneDisplay();
      this.updatePayloadPreview();
    });

    // 12. Style Controls: Font Size, Background
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeDisplay = document.getElementById('fontSizeDisplay');
    fontSizeRange?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      Compositor.fontSize = val;
      fontSizeDisplay.textContent = `${val}px`;
      this.settings.fontSize = val;
      StorageManager.saveSettings(this.settings);
      Compositor.requestRender();
    });

    const bgTypeSelect = document.getElementById('bgTypeSelect');
    bgTypeSelect?.addEventListener('change', (e) => {
      Compositor.bgType = e.target.value;
      this.settings.bgMotion = e.target.value;
      StorageManager.saveSettings(this.settings);
      Compositor.requestRender();
    });

    const checkProgressBar = document.getElementById('checkProgressBar');
    checkProgressBar?.addEventListener('change', (e) => {
      Compositor.showProgressBar = e.target.checked;
      Compositor.requestRender();
    });

    // 13. Audio Controls: Voice, Rate, Volume, Music Mood, Custom Music
    const ttsEngineSelect = document.getElementById('ttsEngineSelect');
    const webGroup = document.getElementById('webSpeechVoiceGroup');
    const elevenGroup = document.getElementById('elevenLabsVoiceGroup');
    const engineBadge = document.getElementById('ttsEngineBadge');

    ttsEngineSelect?.addEventListener('change', async (e) => {
      const mode = e.target.value;
      this.settings.ttsEngine = mode;
      Compositor.ttsEngine = mode;
      StorageManager.saveSettings(this.settings);

      if (webGroup && elevenGroup) {
        webGroup.style.display = mode === 'webspeech' ? 'block' : 'none';
        elevenGroup.style.display = mode === 'elevenlabs' ? 'block' : 'none';
      }
      if (engineBadge) {
        engineBadge.textContent = mode === 'elevenlabs' ? 'Voces Hiperrealistas Activas' : '100% Gratis en Navegador';
        engineBadge.style.color = mode === 'elevenlabs' ? 'var(--accent-purple)' : 'var(--accent-cyan)';
      }

      if (mode === 'elevenlabs' && !this.apiKeys.elevenlabs) {
        this.showToast('Configura tu clave gratuita de ElevenLabs en "API Keys" para activar voces de estudio', 'info', 5000);
      } else if (mode === 'elevenlabs') {
        this.showToast('Motor ElevenLabs activado: las voces se sincronizarán en el video', 'success', 3000);
        await this.initVoices();
      }
    });

    const elevenLabsVoiceSelect = document.getElementById('elevenLabsVoiceSelect');
    elevenLabsVoiceSelect?.addEventListener('change', (e) => {
      const voiceId = e.target.value;
      this.settings.elevenLabsVoiceId = voiceId;
      Compositor.elevenLabsVoiceId = voiceId;
      StorageManager.saveSettings(this.settings);
    });

    // Preview sample button for ElevenLabs voice
    document.getElementById('btnPreviewElevenVoice')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget || document.getElementById('btnPreviewElevenVoice');
      const originalText = '▶ Escuchar Muestra';
      const voiceId = elevenLabsVoiceSelect?.value || this.settings.elevenLabsVoiceId || 'CwhRBWXzGAHq8TQ4Fs17';
      const apiKey = this.apiKeys.elevenlabs;

      if (!apiKey) {
        this.showToast('Por favor introduce tu API Key de ElevenLabs en "API Keys" para escuchar muestras.', 'warning', 4500);
        return;
      }

      btn.textContent = '🔊 Generando muestra...';
      try {
        await TTSEngine.speakText({
          text: 'Hola, esta es una prueba de voz hiperrealista para tus videos de ShortsCraft AI.',
          engine: 'elevenlabs',
          elevenLabsApiKey: apiKey,
          elevenLabsVoiceId: voiceId,
          onEnd: () => {
            btn.textContent = originalText;
          },
        });
      } catch (err) {
        this.showToast(`Error al reproducir muestra: ${err.message || err}`, 'error', 4500);
        btn.textContent = originalText;
      }
    });

    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect?.addEventListener('change', (e) => {
      this.settings.defaultVoice = e.target.value;
      Compositor.voiceName = e.target.value;
      StorageManager.saveSettings(this.settings);
      this.recalibrateSceneDurations();
      this.updatePayloadPreview();
    });

    const speechRateRange = document.getElementById('speechRateRange');
    const speechRateDisplay = document.getElementById('speechRateDisplay');
    speechRateRange?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      speechRateDisplay.textContent = `${val.toFixed(2)}x`;
      this.settings.speechRate = val;
      Compositor.speechRate = val;
      StorageManager.saveSettings(this.settings);
      this.recalibrateSceneDurations();
    });

    const musicVolRange = document.getElementById('musicVolRange');
    const musicVolDisplay = document.getElementById('musicVolDisplay');
    musicVolRange?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      AudioMixer.setMusicVolume(val);
      musicVolDisplay.textContent = `${Math.round(val * 100)}%`;
      this.settings.musicVolume = val;
      StorageManager.saveSettings(this.settings);
    });

    const musicMoodSelect = document.getElementById('musicMoodSelect');
    musicMoodSelect?.addEventListener('change', (e) => {
      if (this.currentProject) {
        this.currentProject.musicMood = e.target.value;
      }
      if (Compositor.isPlaying) {
        AudioMixer.startMusic(e.target.value);
      }
      this.updatePayloadPreview();
    });

    const customMusicInput = document.getElementById('customMusicInput');
    customMusicInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        AudioMixer.loadCustomMusic(file);
      }
    });

    // 14. Rewind and Forward Step buttons
    document.getElementById('btnRewind')?.addEventListener('click', () => {
      Compositor.seek(Compositor.currentTimeSec - 3);
    });
    document.getElementById('btnForward')?.addEventListener('click', () => {
      Compositor.seek(Compositor.currentTimeSec + 3);
    });

    // 15. Copy metadata buttons
    this.bindCopyButtons();

    // 16. Settings Modal
    this.bindSettingsModal();

    // 17. Video Export Buttons
    this.bindExportModal();
  }

  // --- TOAST NOTIFICATION ENGINE ---
  showToast(mensaje, tipo = 'info', duracion = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${tipo}`;

    let icono = 'ℹ️';
    if (tipo === 'success') icono = '✅';
    else if (tipo === 'error') icono = '❌';
    else if (tipo === 'warning') icono = '⚠️';

    toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, duracion);
  }

  // --- SAFE CLIPBOARD COPY WITH FALLBACK ---
  copyToClipboard(texto, btnElement = null, mensajeExito = '¡Copiado!') {
    if (!texto) return;

    const accionExito = () => {
      if (btnElement) {
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = `✓ ${mensajeExito}`;
        btnElement.style.color = 'var(--accent-emerald)';
        btnElement.style.borderColor = 'var(--accent-emerald)';
        setTimeout(() => {
          btnElement.innerHTML = originalHtml;
          btnElement.style.color = '';
          btnElement.style.borderColor = '';
        }, 2000);
      }
      this.showToast(mensajeExito, 'success', 2500);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(accionExito).catch(() => {
        this.fallbackCopiar(texto, accionExito);
      });
    } else {
      this.fallbackCopiar(texto, accionExito);
    }
  }

  fallbackCopiar(texto, callback) {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (callback) callback();
    } catch (err) {
      this.showToast('Por favor copia el texto manualmente', 'warning');
    }
    document.body.removeChild(textArea);
  }

  // --- PWA (PROGRESSIVE WEB APP) SUITE ---
  initPWA() {
    // Register Service Worker for rapid offline caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('ShortsCraft AI Service Worker Activo'))
        .catch((err) => console.warn('SW registration:', err));
    }

    const pwaBanner = document.getElementById('pwa-banner');
    const btnInstalar = document.getElementById('btnInstalarPWA');
    const btnCerrar = document.getElementById('btnCerrarPWA');
    const pwaDesc = document.getElementById('pwa-desc');

    const estaEnModoApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    window.deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      if (!estaEnModoApp && !sessionStorage.getItem('pwa_banner_ignorado')) {
        pwaBanner?.classList.add('show');
      }
    });

    window.addEventListener('appinstalled', () => {
      window.deferredPrompt = null;
      pwaBanner?.classList.remove('show');
      this.showToast('¡ShortsCraft AI instalado con éxito!', 'success');
    });

    btnCerrar?.addEventListener('click', () => {
      pwaBanner?.classList.remove('show');
      sessionStorage.setItem('pwa_banner_ignorado', 'true');
    });

    btnInstalar?.addEventListener('click', async () => {
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const choice = await window.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          pwaBanner?.classList.remove('show');
        }
        window.deferredPrompt = null;
        return;
      }

      if (esIOS) {
        this.showToast("Toca Compartir ⎋ en Safari y luego 'Agregar a Inicio'", 'info', 5000);
        pwaBanner?.classList.remove('show');
        return;
      }

      if (estaEnModoApp) {
        this.showToast('La aplicación ya está instalada', 'success');
        pwaBanner?.classList.remove('show');
        return;
      }

      this.showToast('Para instalar: usa el menú de tu navegador y elige "Instalar aplicación"', 'info', 4000);
    });

    // Detect iOS instruction
    if (esIOS && !estaEnModoApp && !sessionStorage.getItem('pwa_banner_ignorado')) {
      if (pwaDesc) pwaDesc.textContent = "Pulsa Compartir ⎋ y 'Agregar a inicio' ⊕";
      if (btnInstalar) btnInstalar.textContent = "Instrucciones";
      pwaBanner?.classList.add('show');
    }
  }

  // --- MOBILE BOTTOM NAVIGATION & DUAL VIEW ---
  bindMobileNav() {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.targetPanel;
        if (target === 'export') {
          this.switchMobileView('export');
          return;
        }
        navItems.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchMobileView(target);
      });
    });

    // Top switcher pills
    const pillEditor = document.getElementById('btnPillEditor');
    const pillStudio = document.getElementById('btnPillStudio');
    pillEditor?.addEventListener('click', () => this.switchMobileView('create'));
    pillStudio?.addEventListener('click', () => this.switchMobileView('studio'));
  }

  switchMobileView(view) {
    const controlPanel = document.getElementById('mobileControlPanel');
    const previewCol = document.getElementById('mobilePreviewColumn');
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
      if (view === 'create') document.querySelector('[data-tab="tab-ai"]')?.click();
      if (view === 'style') document.querySelector('[data-tab="tab-style"]')?.click();
      if (view === 'seo') document.querySelector('[data-tab="tab-seo"]')?.click();
      if (view === 'export') {
        const btnExp = document.getElementById('btnExportVideo') || document.getElementById('btnHeaderExport');
        btnExp?.click();
      }
      return;
    }

    if (view === 'export') {
      const btnExp = document.getElementById('btnExportVideo') || document.getElementById('btnHeaderExport');
      btnExp?.click();
      return;
    }

    if (view === 'studio') {
      controlPanel?.classList.remove('mobile-active');
      previewCol?.classList.add('mobile-active');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      previewCol?.classList.remove('mobile-active');
      controlPanel?.classList.add('mobile-active');
      window.scrollTo({ top: 0, behavior: 'instant' });

      if (view === 'create') document.querySelector('[data-tab="tab-ai"]')?.click();
      if (view === 'style') document.querySelector('[data-tab="tab-style"]')?.click();
      if (view === 'seo') document.querySelector('[data-tab="tab-seo"]')?.click();
    }

    // Sync top pills
    const isStudioActive = view === 'studio';
    document.getElementById('btnPillEditor')?.classList.toggle('active', !isStudioActive);
    document.getElementById('btnPillStudio')?.classList.toggle('active', isStudioActive);

    // Sync bottom navigation items
    document.querySelectorAll('.bottom-nav .nav-item').forEach((b) => {
      b.classList.toggle('active', b.dataset.targetPanel === view);
    });
  }

  // --- TYPOGRAPHY SELECTOR ---
  bindFontSelector() {
    const fontSelect = document.getElementById('fontFamilySelect');
    if (!fontSelect) return;

    if (this.settings.fontFamily) {
      fontSelect.value = this.settings.fontFamily;
    }

    fontSelect.addEventListener('change', (e) => {
      const chosenFont = e.target.value;
      Compositor.fontFamily = chosenFont;
      this.settings.fontFamily = chosenFont;
      StorageManager.saveSettings(this.settings);
      Compositor.requestRender();
      this.showToast(`Tipografía viral: ${chosenFont}`, 'info', 2000);
    });
  }

  bindCopyButtons() {
    document.getElementById('btnCopyTitle')?.addEventListener('click', (e) => {
      const title = document.getElementById('metaTitleInput').value;
      this.copyToClipboard(title, e.target, '¡Título Copiado!');
    });

    document.getElementById('btnCopyHashtags')?.addEventListener('click', (e) => {
      const tags = (this.currentProject?.hashtags || []).join(' ');
      this.copyToClipboard(tags, e.target, '¡Hashtags Copiados!');
    });

    document.getElementById('btnCopyDesc')?.addEventListener('click', (e) => {
      const desc = document.getElementById('metaDescTextarea').value;
      this.copyToClipboard(desc, e.target, '¡Copy Copiado!');
    });

    // Master Copy All SEO
    document.getElementById('btnCopyAllSEO')?.addEventListener('click', (e) => {
      const title = document.getElementById('metaTitleInput')?.value || '';
      const tags = (this.currentProject?.hashtags || []).join(' ');
      const desc = document.getElementById('metaDescTextarea')?.value || '';
      const fullPackage = `${title}\n\n${desc}\n\n${tags}`.trim();
      this.copyToClipboard(fullPackage, e.target, '¡Paquete SEO Copiado!');
    });
  }

  bindSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const openBtn = document.getElementById('btnSettings');
    const closeBtn = document.getElementById('btnCloseSettings');
    const saveBtn = document.getElementById('btnSaveSettings');

    const inpGemini = document.getElementById('apiKeyGemini');
    const inpOpenAI = document.getElementById('apiKeyOpenAI');
    const inpGroq = document.getElementById('apiKeyGroq');
    const inpPexels = document.getElementById('apiKeyPexels');
    const inpElevenLabs = document.getElementById('apiKeyElevenLabs');

    openBtn?.addEventListener('click', () => {
      if (inpGemini) inpGemini.value = this.apiKeys.gemini || '';
      if (inpOpenAI) inpOpenAI.value = this.apiKeys.openai || '';
      if (inpGroq) inpGroq.value = this.apiKeys.groq || '';
      if (inpPexels) inpPexels.value = this.apiKeys.pexels || '';
      if (inpElevenLabs) inpElevenLabs.value = this.apiKeys.elevenlabs || '';
      modal.classList.add('open');
    });

    const closeModal = () => modal.classList.remove('open');
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    saveBtn?.addEventListener('click', async () => {
      this.apiKeys = {
        gemini: (inpGemini?.value || '').trim(),
        openai: (inpOpenAI?.value || '').trim(),
        groq: (inpGroq?.value || '').trim(),
        pexels: (inpPexels?.value || '').trim(),
        elevenlabs: (inpElevenLabs?.value || '').trim(),
      };
      StorageManager.saveApiKeys(this.apiKeys);
      Compositor.elevenLabsApiKey = this.apiKeys.elevenlabs;
      closeModal();
      this.showToast('Configuración y API Keys guardadas en tu navegador', 'success');
      // Reload ElevenLabs voices if key was updated
      await this.initVoices();
    });
  }

  bindExportModal() {
    const exportModal = document.getElementById('exportModal');
    const btnExport = document.getElementById('btnExportVideo');
    const btnHeaderExport = document.getElementById('btnHeaderExport');
    const btnCancel = document.getElementById('btnCancelExport');
    const fillBar = document.getElementById('exportProgressFill');
    const percentDisplay = document.getElementById('exportProgressPercent');
    const timeDisplay = document.getElementById('exportProgressTime');
    const successBox = document.getElementById('exportSuccessBox');
    const btnDownloadAgain = document.getElementById('btnDownloadAgain');

    const closeExportBtn = document.getElementById('btnCloseExportModal');
    const modalTitle = document.getElementById('exportModalTitle');

    const cancelExport = () => {
      if (this.serverAbortController) {
        this.serverAbortController.abort();
      }
      VideoExporter.cancelExport();
      exportModal.classList.remove('open');
      this.showToast('Exportación cancelada', 'info', 2000);
    };

    const minimizeExport = () => {
      exportModal.classList.remove('open');
      if (VideoExporter.isExporting) {
        this.showToast('Exportación continuando en segundo plano...', 'info', 3000);
      }
    };

    closeExportBtn?.addEventListener('click', minimizeExport);

    exportModal?.addEventListener('click', (e) => {
      if (e.target === exportModal && successBox.style.display !== 'none') {
        exportModal.classList.remove('open');
      }
    });

    const startExport = () => {
      if (this.engineMode === 'server') {
        this.exportVideoViaServer();
        return;
      }

      // Browser Export Pipeline
      exportModal.classList.add('open');
      successBox.style.display = 'none';
      fillBar.style.width = '0%';
      percentDisplay.textContent = '0%';
      if (btnCancel) btnCancel.textContent = 'Cancelar';
      if (modalTitle) modalTitle.textContent = 'Renderizando Video 60 FPS...';
      this.showToast('Compilando video en segundo plano sin bloquear tu pantalla...', 'info', 3000);

      VideoExporter.exportVideo({
        onProgress: ({ percent, currentSec, totalSec, status }) => {
          fillBar.style.width = `${percent}%`;
          percentDisplay.textContent = `${percent}%`;
          timeDisplay.textContent = status || `${currentSec.toFixed(1)}s / ${totalSec.toFixed(1)}s (${percent}%)`;
        },
        onComplete: ({ downloadUrl, filename, blob }) => {
          // Automatic trigger
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Add to session history
          this.addGeneratedVideo({
            id: 'local_' + Date.now().toString(36),
            title: this.currentProject.title || 'Video Short Web',
            format: filename.endsWith('.mp4') ? 'MP4' : 'WebM',
            mode: 'browser',
            url: downloadUrl,
            filename,
            orientation: this.orientation === 'landscape' ? '16:9' : '9:16',
            createdAt: new Date().toLocaleTimeString(),
          });

          // Show success state & toast
          successBox.style.display = 'flex';
          btnDownloadAgain.href = downloadUrl;
          btnDownloadAgain.download = filename;
          if (btnCancel) btnCancel.textContent = 'Listo / Cerrar';
          if (modalTitle) modalTitle.textContent = '🎉 ¡Video Renderizado!';
          this.showToast('🎉 ¡Video renderizado y descargado exitosamente!', 'success', 6000);
        },
        onError: (err) => {
          this.showToast(`Error durante la exportación: ${err}`, 'error', 6000);
          exportModal.classList.remove('open');
        },
      });
    };

    btnExport?.addEventListener('click', startExport);
    btnHeaderExport?.addEventListener('click', startExport);
    btnCancel?.addEventListener('click', () => {
      if (successBox.style.display !== 'none') {
        exportModal.classList.remove('open');
      } else {
        cancelExport();
      }
    });
  }
}

// Start app when DOM is ready
function initShortsCraft() {
  const app = new AppController();
  window.shortscraftApp = app;
  app.init();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initShortsCraft);
} else {
  initShortsCraft();
}
