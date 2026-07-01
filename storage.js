class AppStorage {
  static setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('localStorage setItem error:', error);
    }
  }

  static getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return null;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage removeItem error:', error);
    }
  }

  static clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('localStorage clear error:', error);
    }
  }
}

class AppSettings {
  constructor() {
    this.defaults = {
      theme: 'dark',
      autoSave: true,
      autoSaveInterval: 10000,
      noiseSuppression: true,
      echoCancellation: true,
      autoGain: true,
      defaultLanguage: 'auto',
      whisperApiKey: '',
      openaiApiKey: ''
    };
    this.settings = this.load();
  }

  load() {
    const saved = AppStorage.getItem('appSettings');
    return { ...this.defaults, ...saved };
  }

  save() {
    AppStorage.setItem('appSettings', this.settings);
  }

  get(key) {
    return this.settings[key] ?? this.defaults[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }
}

const appSettings = new AppSettings();