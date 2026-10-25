/**
 * ShortsCraft AI - Main Application Controller
 * Coordinates UI events, Dark2C Human-in-the-Loop scene editor,
 * AI generation, timeline simulator, and in-browser video exporting.
 */

import { StorageManager } from './storage.js';
import { AIEngine, VIRAL_TEMPLATES } from './ai-engine.js';
import { TTSEngine } from './tts-engine.js';
import { MediaService } from './media-service.js';
import { CaptionAnimator } from './caption-animator.js';
import { AudioMixer } from './audio-mixer.js';
import { Compositor } from './compositor.js';
import { VideoExporter } from './recorder.js';

class AppController {
  constructor() {
    this.currentProject = null;
    this.selectedTemplateKey = 'curiosities';
    this.selectedStyleKey = 'hormozi';
    this.settings = StorageManager.getSettings();
    this.apiKeys = StorageManager.getApiKeys();
  }

  async init() {
    // 1. Initialize Canvas Compositor
    const canvas = document.getElementById('shortsCanvas');
    Compositor.init(canvas);
    Compositor.captionStyle = this.settings.captionStyle || 'hormozi';
    Compositor.fontSize = this.settings.fontSize || 58;
    Compositor.bgType = this.settings.bgMotion || 'cyber-grid';
    Compositor.showProgressBar = this.settings.showProgressBar ?? true;

    // 2. Load Speech Voices
    await this.initVoices();

    // 3. Render UI Components
    this.renderTemplateCards();
    this.renderSubtitleStyleCards();
    this.bindEvents();
    this.bindCompositorListeners();

    // 4. Load initial starter project so preview is immediately alive
    this.loadInitialProject();
  }

  async initVoices() {
    const voiceSelect = document.getElementById('voiceSelect');
    const voices = await TTSEngine.loadVoices();
    voiceSelect.innerHTML = '';

    // Prioritize Spanish and English voices
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
      }
      voiceSelect.appendChild(opt);
    });
  }

  loadInitialProject() {
    const starter = VIRAL_TEMPLATES.curiosities.generator('el Cerebro Humano');
    this.setProject(starter);
  }

  setProject(project) {
    this.currentProject = project;
    StorageManager.saveCurrentProject(project);

    // Sync compositor
    Compositor.loadProject(project);

    // Sync UI elements
    this.renderSceneCards();
    this.updateMetadataTab();
    this.updateTimeDisplay(0, Compositor.totalDurationSec);

    // Sync background dropdown and music mood
    if (project.musicMood) {
      const moodSelect = document.getElementById('musicMoodSelect');
      if (moodSelect) moodSelect.value = project.musicMood;
    }
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
        <div class="template-desc">Fórmula de alta retención para Shorts y TikTok.</div>
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
      });
      container.appendChild(card);
    });
  }

  /**
   * Dark2C Human-in-the-Loop Scene Editor
   * Allows live script tweaking, duration adjustments, and per-scene video swapping
   */
  renderSceneCards() {
    const container = document.getElementById('scenesContainer');
    if (!container || !this.currentProject) return;
    container.innerHTML = '';

    this.currentProject.scenes.forEach((scene, idx) => {
      const card = document.createElement('div');
      card.className = `scene-card ${idx === Compositor.currentSceneIndex ? 'active-scene' : ''}`;
      card.dataset.sceneIndex = idx;

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
            <button class="btn-step btn-preview-scene" title="Previsualizar esta escena">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
            <button class="btn-step btn-delete-scene" title="Eliminar escena">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <textarea class="scene-textarea">${scene.text}</textarea>

        <div class="scene-footer">
          <div class="keyword-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span>${scene.keyword || 'clip vertical'}</span>
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
      });

      // Duration editing
      const durationField = card.querySelector('.scene-duration-field');
      durationField.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 3.5;
        scene.durationSec = Math.max(1.5, Math.min(val, 20));
        scene.words = TTSEngine.calculateWordTimestamps(scene.text, scene.durationSec);
        Compositor.loadProject(this.currentProject);
        this.updateTimeDisplay(Compositor.currentTimeSec, Compositor.totalDurationSec);
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
          alert('El short debe tener al menos una escena.');
          return;
        }
        this.currentProject.scenes.splice(idx, 1);
        Compositor.loadProject(this.currentProject);
        this.renderSceneCards();
      });

      // Upload custom clip for this scene
      const fileInput = card.querySelector('.scene-file-input');
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          MediaService.setCustomMediaForScene(scene.id, file);
          const badge = card.querySelector('.scene-media-controls');
          badge.innerHTML = `<span style="color: #10b981; font-size: 0.75rem; font-weight: 700;">✓ Clip Cargado</span>`;
          Compositor.seek(Compositor.currentTimeSec); // Force redraw
        }
      });

      container.appendChild(card);
    });
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

  bindCompositorListeners() {
    const playPauseBtn = document.getElementById('btnPlayPause');
    const playIconSvg = document.getElementById('playIconSvg');
    const timelineSlider = document.getElementById('timelineSlider');
    const phoneScreen = document.getElementById('phoneScreen');

    Compositor.onTimeUpdate = (currentSec, totalSec) => {
      this.updateTimeDisplay(currentSec, totalSec);
      if (totalSec > 0) {
        timelineSlider.value = (currentSec / totalSec) * 100;
      }
    };

    Compositor.onSceneChange = (sceneIndex) => {
      document.querySelectorAll('.scene-card').forEach((card, idx) => {
        card.classList.toggle('active-scene', idx === sceneIndex);
      });
      const display = document.getElementById('currentSceneDisplay');
      if (display && this.currentProject) {
        display.textContent = `Escena ${sceneIndex + 1}/${this.currentProject.scenes.length}`;
      }
    };

    Compositor.onPlaybackEnd = () => {
      this.updatePlayPauseButton(false);
    };

    // Phone screen click to toggle play
    phoneScreen.addEventListener('click', () => {
      this.togglePlayPause();
    });

    // Timeline Slider input
    timelineSlider.addEventListener('input', (e) => {
      const frac = parseFloat(e.target.value) / 100;
      Compositor.seek(frac * Compositor.totalDurationSec);
    });

    // Main Play/Pause Button
    playPauseBtn.addEventListener('click', (e) => {
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
      this.updatePlayPauseButton(false);
    } else {
      Compositor.play();
      this.updatePlayPauseButton(true);
    }
  }

  updatePlayPauseButton(isPlaying) {
    const playIconSvg = document.getElementById('playIconSvg');
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

    // 2. Generate with AI Button
    const btnGenerate = document.getElementById('btnGenerateScript');
    btnGenerate.addEventListener('click', async () => {
      const topic = document.getElementById('topicInput').value.trim();
      const provider = document.getElementById('aiProviderSelect').value;
      const language = document.getElementById('languageSelect').value;

      let apiKey = '';
      if (provider === 'gemini') apiKey = this.apiKeys.gemini;
      if (provider === 'openai') apiKey = this.apiKeys.openai;
      if (provider === 'groq') apiKey = this.apiKeys.groq;

      btnGenerate.disabled = true;
      btnGenerate.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        <span>Creando Guión & Sincronizando...</span>
      `;

      try {
        const generated = await AIEngine.generateScript({
          topic,
          templateKey: this.selectedTemplateKey,
          provider,
          apiKey,
          language,
        });

        this.setProject(generated);

        // Switch automatically to Scene Editor tab so user sees the generated cards
        const scenesTabBtn = document.querySelector('[data-tab="tab-scenes"]');
        if (scenesTabBtn) scenesTabBtn.click();
      } catch (err) {
        alert(`Error al generar guión: ${err.message}`);
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
          <span>Crear Guión & Generar Short</span>
        `;
      }
    });

    // 3. Add Scene Button
    const btnAddScene = document.getElementById('btnAddScene');
    btnAddScene.addEventListener('click', () => {
      if (!this.currentProject) return;
      const newId = this.currentProject.scenes.length + 1;
      this.currentProject.scenes.push({
        id: newId,
        text: 'Nueva escena editable. Añade tu texto aquí.',
        keyword: 'cinematic vertical video',
        durationSec: 4.0,
        words: TTSEngine.calculateWordTimestamps('Nueva escena editable. Añade tu texto aquí.', 4.0),
      });
      Compositor.loadProject(this.currentProject);
      this.renderSceneCards();
    });

    // 4. Style Controls: Font Size, Y Pos, Background
    const fontSizeRange = document.getElementById('fontSizeRange');
    const fontSizeDisplay = document.getElementById('fontSizeDisplay');
    fontSizeRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      Compositor.fontSize = val;
      fontSizeDisplay.textContent = `${val}px`;
      this.settings.fontSize = val;
      StorageManager.saveSettings(this.settings);
    });

    const yPosRange = document.getElementById('yPosRange');
    const yPosDisplay = document.getElementById('yPosDisplay');
    yPosRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      Compositor.captionYPercent = val;
      yPosDisplay.textContent = `${val}%`;
    });

    const bgTypeSelect = document.getElementById('bgTypeSelect');
    bgTypeSelect.addEventListener('change', (e) => {
      Compositor.bgType = e.target.value;
      this.settings.bgMotion = e.target.value;
      StorageManager.saveSettings(this.settings);
    });

    const checkProgressBar = document.getElementById('checkProgressBar');
    checkProgressBar.addEventListener('change', (e) => {
      Compositor.showProgressBar = e.target.checked;
    });

    // 5. Audio Controls: Voice, Rate, Volume, Music Mood, Custom Music
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.addEventListener('change', (e) => {
      this.settings.defaultVoice = e.target.value;
      StorageManager.saveSettings(this.settings);
    });

    const speechRateRange = document.getElementById('speechRateRange');
    const speechRateDisplay = document.getElementById('speechRateDisplay');
    speechRateRange.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      speechRateDisplay.textContent = `${val.toFixed(2)}x`;
      this.settings.speechRate = val;
      StorageManager.saveSettings(this.settings);
    });

    const musicVolRange = document.getElementById('musicVolRange');
    const musicVolDisplay = document.getElementById('musicVolDisplay');
    musicVolRange.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      AudioMixer.setMusicVolume(val);
      musicVolDisplay.textContent = `${Math.round(val * 100)}%`;
      this.settings.musicVolume = val;
      StorageManager.saveSettings(this.settings);
    });

    const musicMoodSelect = document.getElementById('musicMoodSelect');
    musicMoodSelect.addEventListener('change', (e) => {
      if (this.currentProject) {
        this.currentProject.musicMood = e.target.value;
      }
      if (Compositor.isPlaying) {
        AudioMixer.startMusic(e.target.value);
      }
    });

    const customMusicInput = document.getElementById('customMusicInput');
    customMusicInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        AudioMixer.loadCustomMusic(file);
      }
    });

    // 6. Rewind and Forward Step buttons
    document.getElementById('btnRewind').addEventListener('click', () => {
      Compositor.seek(Compositor.currentTimeSec - 3);
    });
    document.getElementById('btnForward').addEventListener('click', () => {
      Compositor.seek(Compositor.currentTimeSec + 3);
    });

    // 7. Copy metadata buttons
    this.bindCopyButtons();

    // 8. Settings Modal
    this.bindSettingsModal();

    // 9. Video Export
    this.bindExportModal();
  }

  bindCopyButtons() {
    const copy = (text, btn) => {
      navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = '¡Copiado!';
      btn.style.borderColor = '#10b981';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.borderColor = '';
      }, 1500);
    };

    document.getElementById('btnCopyTitle').addEventListener('click', (e) => {
      const title = document.getElementById('metaTitleInput').value;
      copy(title, e.target);
    });

    document.getElementById('btnCopyHashtags').addEventListener('click', (e) => {
      const tags = (this.currentProject?.hashtags || []).join(' ');
      copy(tags, e.target);
    });

    document.getElementById('btnCopyDesc').addEventListener('click', (e) => {
      const desc = document.getElementById('metaDescTextarea').value;
      copy(desc, e.target);
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

    openBtn.addEventListener('click', () => {
      inpGemini.value = this.apiKeys.gemini || '';
      inpOpenAI.value = this.apiKeys.openai || '';
      inpGroq.value = this.apiKeys.groq || '';
      inpPexels.value = this.apiKeys.pexels || '';
      modal.classList.add('open');
    });

    const closeModal = () => modal.classList.remove('open');
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    saveBtn.addEventListener('click', () => {
      this.apiKeys = {
        gemini: inpGemini.value.trim(),
        openai: inpOpenAI.value.trim(),
        groq: inpGroq.value.trim(),
        pexels: inpPexels.value.trim(),
      };
      StorageManager.saveApiKeys(this.apiKeys);
      closeModal();
      alert('Configuración y API Keys guardadas localmente en tu navegador.');
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

    const startExport = () => {
      exportModal.classList.add('open');
      successBox.style.display = 'none';
      fillBar.style.width = '0%';
      percentDisplay.textContent = '0%';

      VideoExporter.exportVideo({
        onProgress: ({ percent, currentSec, totalSec }) => {
          fillBar.style.width = `${percent}%`;
          percentDisplay.textContent = `${percent}%`;
          timeDisplay.textContent = `${currentSec.toFixed(1)}s / ${totalSec.toFixed(1)}s`;
        },
        onComplete: ({ downloadUrl, filename }) => {
          // Automatic trigger
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Show success state
          successBox.style.display = 'flex';
          btnDownloadAgain.href = downloadUrl;
          btnDownloadAgain.download = filename;
        },
        onError: (err) => {
          alert(`Error durante la exportación: ${err}`);
          exportModal.classList.remove('open');
        },
      });
    };

    btnExport.addEventListener('click', startExport);
    btnHeaderExport.addEventListener('click', startExport);

    btnCancel.addEventListener('click', () => {
      VideoExporter.cancelExport();
      exportModal.classList.remove('open');
    });
  }
}

// Start app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
