/**
 * Storage Manager for ShortsCraft AI
 * Safely persists API keys, projects, and user preferences in localStorage.
 * No sensitive data ever leaves the client's browser.
 */

const STORAGE_KEYS = {
  API_KEYS: 'shortscraft_api_keys',
  SETTINGS: 'shortscraft_settings',
  LAST_PROJECT: 'shortscraft_last_project',
  SAVED_PROJECTS: 'shortscraft_saved_projects',
};

export const StorageManager = {
  getApiKeys() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      return raw ? JSON.parse(raw) : {
        gemini: '',
        openai: '',
        groq: '',
        pexels: '',
        elevenlabs: ''
      };
    } catch (e) {
      console.warn('Failed to read API keys from localStorage', e);
      return {};
    }
  },

  saveApiKeys(keys) {
    try {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
      return true;
    } catch (e) {
      console.error('Failed to save API keys', e);
      return false;
    }
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : {
        defaultVoice: '',
        speechRate: 1.15,
        speechPitch: 1.0,
        musicVolume: 0.25,
        autoDucking: true,
        captionStyle: 'hormozi',
        fontSize: 54,
        highlightColor: '#FACC15',
        primaryColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 8,
        uppercase: true,
        bgMotion: 'cyber-grid',
        showProgressBar: true,
      };
    } catch (e) {
      console.warn('Failed to read settings', e);
      return {};
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('Failed to save settings', e);
      return false;
    }
  },

  saveCurrentProject(project) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PROJECT, JSON.stringify(project));
      return true;
    } catch (e) {
      console.error('Failed to save project', e);
      return false;
    }
  },

  getLastProject() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LAST_PROJECT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
};
