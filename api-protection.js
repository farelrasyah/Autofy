/**
 * API Key Protection System untuk Autofy Extension
 * Menyembunyikan API key dari source code dengan obfuscation
 */

class ApiKeyProtection {
  constructor() {    // Encoded API key - Base64 encoded untuk menyembunyikan di source code
    this.encodedKeys = [
      'QUl6YVN5QVJJS3dubHJVZUl4cEd2VFM1VmhSeHVSMkhoV1FDeG9Z', // Base64 encoded API key
      '7ea8c820a525b78c3b2b4b5e8a4d2f1c9e6b8a7f5d3c1a9e8b7f4c2d1a', // Hex dummy
      'sk_test_dummy_key_12345', // Dummy key
    ];
    
    // Real key akan dipilih berdasarkan hash environment
    this.keyIndex = this.getKeyIndex();
  }

  /**
   * Mendapatkan API key yang sudah di-decode
   */
  getApiKey() {
    try {
      // Decode base64 key
      const encodedKey = this.encodedKeys[0];
      const decodedKey = atob(encodedKey);
      
      // Validasi format
      if (decodedKey.startsWith('AIza') && decodedKey.length > 30) {
        return decodedKey;
      }
      
      // Fallback ke hardcoded (akan di-obfuscate)
      return this.getFallbackKey();
    } catch (error) {
      console.warn('Key decode failed, using fallback');
      return this.getFallbackKey();
    }
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
