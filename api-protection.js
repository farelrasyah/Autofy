/**
 * API Key Protection System untuk Autofy Extension
 * Menyembunyikan API key dari source code dengan obfuscation
 */

class ApiKeyProtection {
  constructor() {
    // Multiple API keys untuk failover jika quota habis
    this.encodedKeys = [
      'QUl6YVN5QVJJS3dubHJVZUl4cEd2VFM1VmhSeHVSMkhoV1FDeG9Z', // Base64 encoded API key 1
      'QUl6YVN5Q0JUV1Q0YmhLcENlQXoxUWRHUGNOWWNGZEJHb1k5Skk', // Base64 encoded API key 2 (fallback)
      'QUl6YVN5QlM0VnBXV2ZKa1BmUzVaVGRMdEhxQjNWeGZZYzZMbkk', // Base64 encoded API key 3 (fallback)
    ];
    
    // Track quota status untuk setiap key
    this.keyStatus = {
      0: { quota_exceeded: false, last_error: null },
      1: { quota_exceeded: false, last_error: null },
      2: { quota_exceeded: false, last_error: null }
    };
    
    this.currentKeyIndex = 0;
  }
  /**
   * Mendapatkan API key yang sedang aktif
   */
  getApiKey() {
    return this.getAvailableApiKey();
  }

  /**
   * Mendapatkan API key yang tersedia (belum quota exceeded)
   */
  getAvailableApiKey() {
    // Cari key yang belum quota exceeded
    for (let i = 0; i < this.encodedKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.encodedKeys.length;
      
      if (!this.keyStatus[keyIndex].quota_exceeded) {
        this.currentKeyIndex = keyIndex;
        return this.decodeApiKey(keyIndex);
      }
    }
    
    // Jika semua key quota exceeded, reset dan coba lagi
    console.warn('All API keys quota exceeded, resetting status...');
    this.resetQuotaStatus();
    return this.decodeApiKey(0);
  }

  /**
   * Decode API key berdasarkan index
   */
  decodeApiKey(keyIndex) {
    try {
      const encodedKey = this.encodedKeys[keyIndex];
      const decodedKey = atob(encodedKey);
      
      // Validasi format
      if (decodedKey.startsWith('AIza') && decodedKey.length > 30) {
        return decodedKey;
      }
      
      // Fallback ke hardcoded
      return this.getFallbackKey();
    } catch (error) {
      console.warn(`Key decode failed for index ${keyIndex}, using fallback`);
      return this.getFallbackKey();
    }
  }

  /**
   * Mark API key sebagai quota exceeded
   */
  markQuotaExceeded(apiKey, error) {
    // Cari index dari API key yang error
    for (let i = 0; i < this.encodedKeys.length; i++) {
      const decodedKey = this.decodeApiKey(i);
      if (decodedKey === apiKey) {
        this.keyStatus[i].quota_exceeded = true;
        this.keyStatus[i].last_error = error;
        console.warn(`API key ${i} marked as quota exceeded:`, error);
        break;
      }
    }
  }

  /**
   * Reset status quota untuk semua keys
   */
  resetQuotaStatus() {
    Object.keys(this.keyStatus).forEach(key => {
      this.keyStatus[key].quota_exceeded = false;
      this.keyStatus[key].last_error = null;
    });
  }

  /**
   * Get next available API key untuk retry
   */
  getNextApiKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.encodedKeys.length;
    return this.getAvailableApiKey();
  }

  /**
   * Fallback API key dengan simple obfuscation
   */
  getFallbackKey() {
    // Split API key menjadi beberapa bagian untuk obfuscation
    const parts = [
      'AIzaSy', 'ARIKwn', 'lrUeIx', 'pGvTS5',
      'VhRxuR', '2HhWQC', 'xoY'
    ];
    return parts.join('');
  }

  /**
   * Get key index berdasarkan environment
   */
  getKeyIndex() {
    // Simple hash dari timestamp untuk variasi
    const hash = Date.now().toString().slice(-1);
    return parseInt(hash) % this.encodedKeys.length;
  }

  /**
   * Validasi API key
   */
  isValidKey(key) {
    return key && key.length > 20 && key.startsWith('AIza');
  }

  /**
   * Encode key untuk storage (jika diperlukan)
   */
  encodeKey(key) {
    return btoa(key);
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiKeyProtection;
} else {
  window.ApiKeyProtection = ApiKeyProtection;
}
