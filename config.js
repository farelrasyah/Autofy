/**
 * Configuration Manager untuk Autofy Extension
 * Mengelola API key dan pengaturan lainnya dengan proteksi API key
 */
class ConfigManager {
  constructor() {
    this.storageKey = 'autofy_config';
    this.defaultConfig = {
      geminiApiKey: '', // Akan diisi otomatis
      autoFillEnabled: true,
      responseStyle: 'natural', // natural, formal, brief
      language: 'id', // id untuk Indonesia, en untuk English
      fillSpeed: 'normal' // slow, normal, fast
    };
    
    // Initialize API protection
    this.apiProtection = new ApiKeyProtection();
  }  /**
   * Mendapatkan konfigurasi dari Chrome storage
   */
  async getConfig() {
    try {
      const result = await chrome.storage.sync.get([this.storageKey]);
      const config = result[this.storageKey] || this.defaultConfig;
      
      // Selalu gunakan built-in API key dari protection system
      config.geminiApiKey = this.apiProtection.getApiKey();
      
      return config;
    } catch (error) {
      console.error('Error getting config:', error);
      return { 
        ...this.defaultConfig, 
        geminiApiKey: this.apiProtection.getApiKey() 
      };
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
  }  /**
   * Mendapatkan API key dari protection system
   */
  getApiKey() {
    return this.apiProtection.getApiKey();
  }

  /**
   * Mendapatkan API key dari environment (deprecated - untuk compatibility)
   */
  getEnvApiKey() {
    return this.apiProtection.getApiKey();
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
