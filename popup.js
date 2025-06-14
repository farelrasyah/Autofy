/**
 * Popup Script untuk Autofy Extension
 * Mengelola interface pengaturan dan kontrol extension
 */

let configManager;
let currentConfig = {};

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Initializing Autofy popup...');
  
  try {
    configManager = new ConfigManager();
    await loadCurrentConfig();
    setupEventListeners();
    setupQuickActions();
    
    // Check if opened from settings
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('settings') === 'true') {
      showStatusMessage('Pengaturan Autofy', 'info');
    }
    
    console.log('✅ Popup initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing popup:', error);
    showStatusMessage('Error initializing popup', 'error');
  }
});

/**
 * Load current configuration
 */
async function loadCurrentConfig() {
  try {
    currentConfig = await configManager.getConfig();
    populateForm(currentConfig);
    
    // Test API connection if key exists
    if (currentConfig.geminiApiKey && configManager.isValidApiKey(currentConfig.geminiApiKey)) {
      testGeminiConnection(false); // Don't show success message
    }
  } catch (error) {
    console.error('Error loading config:', error);
    showStatusMessage('Gagal memuat konfigurasi', 'error');
  }
}

/**
 * Populate form with current config
 */
function populateForm(config) {
  // API Key
  const apiKeyInput = document.getElementById('api-key');
  if (config.geminiApiKey) {
    apiKeyInput.value = config.geminiApiKey;
  }
  
  // Response style
  const responseStyleSelect = document.getElementById('response-style');
  responseStyleSelect.value = config.responseStyle || 'natural';
  
  // Language
  const languageSelect = document.getElementById('language');
  languageSelect.value = config.language || 'id';
  
  // Fill speed
  const fillSpeedSelect = document.getElementById('fill-speed');
  fillSpeedSelect.value = config.fillSpeed || 'normal';
  
  // Checkboxes
  document.getElementById('auto-fill').checked = config.autoFillEnabled !== false;
  document.getElementById('notifications').checked = config.notifications !== false;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // API Key toggle visibility
  document.getElementById('toggle-api-key').addEventListener('click', toggleApiKeyVisibility);
  
  // Test connection button
  document.getElementById('test-connection-btn').addEventListener('click', () => testGeminiConnection(true));
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveConfiguration);
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetConfiguration);
  
  // API key input change
  document.getElementById('api-key').addEventListener('input', handleApiKeyChange);
  
  // Form changes
  const formElements = ['response-style', 'language', 'fill-speed', 'auto-fill', 'notifications'];
  formElements.forEach(id => {
    const element = document.getElementById(id);
    element.addEventListener('change', handleFormChange);
  });
}

/**
 * Setup quick actions
 */
function setupQuickActions() {
  // Open Google Form
  document.getElementById('open-form-btn').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://docs.google.com/forms/'
    });
    window.close();
  });
  
  // View tutorial
  document.getElementById('view-tutorial-btn').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/your-username/autofy-extension/wiki/Tutorial'
    });
    window.close();
  });
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById('api-key');
  const toggleBtn = document.getElementById('toggle-api-key');
  
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleBtn.textContent = '🙈';
  } else {
    apiKeyInput.type = 'password';
    toggleBtn.textContent = '👁️';
  }
}

/**
 * Handle API key input change
 */
function handleApiKeyChange() {
  const apiKey = document.getElementById('api-key').value;
  const connectionStatus = document.getElementById('connection-status');
  
  if (!apiKey) {
    updateConnectionStatus('disconnected', 'Belum terhubung');
  } else if (!configManager.isValidApiKey(apiKey)) {
    updateConnectionStatus('disconnected', 'API key tidak valid');
  } else {
    updateConnectionStatus('testing', 'Siap untuk test...');
  }
}

/**
 * Handle form changes
 */
function handleFormChange() {
  // Enable save button when changes are made
  const saveBtn = document.getElementById('save-btn');
  saveBtn.style.opacity = '1';
  saveBtn.style.transform = 'scale(1.02)';
  
  setTimeout(() => {
    saveBtn.style.transform = 'scale(1)';
  }, 100);
}

/**
 * Test Gemini connection
 */
async function testGeminiConnection(showResult = true) {
  const apiKey = document.getElementById('api-key').value;
  const testBtn = document.getElementById('test-connection-btn');
  
  if (!apiKey) {
    showStatusMessage('Masukkan API key terlebih dahulu', 'error');
    return;
  }
  
  if (!configManager.isValidApiKey(apiKey)) {
    showStatusMessage('Format API key tidak valid', 'error');
    updateConnectionStatus('disconnected', 'API key tidak valid');
    return;
  }
  
  // Update UI
  testBtn.disabled = true;
  testBtn.innerHTML = '<span>⏳</span> Testing...';
  updateConnectionStatus('testing', 'Menguji koneksi...');
  try {
    // Send test request to background script dengan timeout
    const response = await new Promise((resolve, reject) => {
      // Set timeout untuk message
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout - background script tidak merespons'));
      }, 15000); // 15 detik timeout
      
      chrome.runtime.sendMessage({
        action: 'testGeminiConnection',
        apiKey: apiKey
      }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      updateConnectionStatus('connected', 'Terhubung');
      if (showResult) {
        showStatusMessage('✅ Koneksi berhasil! API key valid.', 'success');
      }
    } else {
      updateConnectionStatus('disconnected', 'Koneksi gagal');
      if (showResult) {
        showStatusMessage(`❌ Koneksi gagal: ${response.error}`, 'error');
      }
    }
  } catch (error) {
    updateConnectionStatus('disconnected', 'Error testing');
    if (showResult) {
      showStatusMessage(`❌ Error: ${error.message}`, 'error');
    }
  } finally {
    // Reset button
    testBtn.disabled = false;
    testBtn.innerHTML = '<span>🔗</span> Test Koneksi Gemini';
  }
}

/**
 * Update connection status
 */
function updateConnectionStatus(status, message) {
  const connectionStatus = document.getElementById('connection-status');
  const indicator = connectionStatus.querySelector('.status-indicator');
  const text = connectionStatus.querySelector('span');
  
  // Remove all status classes
  indicator.classList.remove('connected', 'disconnected', 'testing');
  
  // Add new status
  indicator.classList.add(status);
  text.textContent = message;
}

/**
 * Save configuration
 */
async function saveConfiguration() {
  const saveBtn = document.getElementById('save-btn');
  
  try {
    // Get form data
    const newConfig = {
      geminiApiKey: document.getElementById('api-key').value,
      responseStyle: document.getElementById('response-style').value,
      language: document.getElementById('language').value,
      fillSpeed: document.getElementById('fill-speed').value,
      autoFillEnabled: document.getElementById('auto-fill').checked,
      notifications: document.getElementById('notifications').checked
    };
    
    // Validate API key
    if (newConfig.geminiApiKey && !configManager.isValidApiKey(newConfig.geminiApiKey)) {
      showStatusMessage('API key tidak valid', 'error');
      return;
    }
    
    // Update button state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳</span> Menyimpan...';
    
    // Save configuration
    const success = await configManager.saveConfig(newConfig);
    
    if (success) {
      currentConfig = newConfig;
      showStatusMessage('✅ Konfigurasi berhasil disimpan!', 'success');
      
      // Test connection if API key changed
      if (newConfig.geminiApiKey) {
        setTimeout(() => testGeminiConnection(false), 500);
      }
    } else {
      showStatusMessage('❌ Gagal menyimpan konfigurasi', 'error');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    showStatusMessage('❌ Error: ' + error.message, 'error');
  } finally {
    // Reset button
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾</span> Simpan';
  }
}

/**
 * Reset configuration
 */
async function resetConfiguration() {
  const resetBtn = document.getElementById('reset-btn');
  
  if (!confirm('Yakin ingin mereset semua pengaturan ke default?')) {
    return;
  }
  
  try {
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<span>⏳</span> Reset...';
    
    // Reset to default config
    await configManager.resetConfig();
    
    // Reload config and populate form
    await loadCurrentConfig();
    
    showStatusMessage('✅ Konfigurasi berhasil direset!', 'success');
  } catch (error) {
    console.error('Error resetting config:', error);
    showStatusMessage('❌ Gagal mereset konfigurasi', 'error');
  } finally {
    resetBtn.disabled = false;
    resetBtn.innerHTML = '<span>🔄</span> Reset';
  }
}

/**
 * Show status message
 */
function showStatusMessage(message, type = 'info') {
  const statusEl = document.getElementById('status-message');
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = 'block';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 5000);
}

/**
 * Check if current tab is Google Form
 */
async function checkCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url && currentTab.url.includes('docs.google.com/forms/')) {
      // Add quick action for current form
      addCurrentFormAction(currentTab);
    }
  } catch (error) {
    console.warn('Could not check current tab:', error);
  }
}

/**
 * Add quick action for current form
 */
function addCurrentFormAction(tab) {
  const quickActions = document.querySelector('.quick-actions');
  
  const currentFormBtn = document.createElement('button');
  currentFormBtn.className = 'quick-btn';
  currentFormBtn.innerHTML = `
    <span>⚡</span>
    Analisis Form Saat Ini
  `;
  
  currentFormBtn.addEventListener('click', () => {
    chrome.tabs.sendMessage(tab.id, { action: 'analyzeForm' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatusMessage('❌ Tidak dapat berkomunikasi dengan halaman form', 'error');
      } else {
        showStatusMessage('✅ Form sedang dianalisis...', 'info');
        window.close();
      }
    });
  });
  
  // Insert after the first quick action
  const firstBtn = quickActions.querySelector('.quick-btn');
  firstBtn.parentNode.insertBefore(currentFormBtn, firstBtn.nextSibling);
}

// Check current tab when popup loads
checkCurrentTab();

console.log('🎯 Autofy popup script loaded');
