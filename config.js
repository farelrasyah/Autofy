/**
 * Configuration Manager untuk Autofy Extension
 * Mengelola API key dan pengaturan lainnya
 */
class ConfigManager {
  constructor() {
    this.storageKey = 'autofy_config';
    this.defaultConfig = {
      geminiApiKey: '',
      autoFillEnabled: true,
      responseStyle: 'natural', // natural, formal, brief
      language: 'id' // id untuk Indonesia, en untuk English
    };
  }

  /**
   * Mendapatkan konfigurasi dari Chrome storage
   */
  async getConfig() {
    try {
      const result = await chrome.storage.sync.get([this.storageKey]);
      const config = result[this.storageKey] || this.defaultConfig;
      
      // Fallback ke environment variable jika API key kosong
      if (!config.geminiApiKey) {
        config.geminiApiKey = this.getEnvApiKey();
      }
      
      return config;
    } catch (error) {
      console.error('Error getting config:', error);
      return { ...this.defaultConfig, geminiApiKey: this.getEnvApiKey() };
    }
  }

  /**
   * Menyimpan konfigurasi ke Chrome storage
   */
  async saveConfig(config) {
    try {
      await chrome.storage.sync.set({
        [this.storageKey]: { ...this.defaultConfig, ...config }
      });
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  /**
   * Mendapatkan API key dari environment (untuk development)
   */
  getEnvApiKey() {
    // Ini akan di-replace saat build dengan API key yang sebenarnya
    return '__GEMINI_API_KEY__';
  }

  /**
   * Validasi API key
   */
  isValidApiKey(apiKey) {
    return apiKey && apiKey.length > 20 && apiKey.startsWith('AIza');
  }

  /**
   * Reset konfigurasi ke default
   */
  async resetConfig() {
    return await this.saveConfig(this.defaultConfig);
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigManager;
} else {
  window.ConfigManager = ConfigManager;
}
