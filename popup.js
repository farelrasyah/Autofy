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
    
    // Always test AI connection since API key is built-in
    testGeminiConnection(false); // Don't show success message
  } catch (error) {
    console.error('Error loading config:', error);
    showStatusMessage('Gagal memuat konfigurasi', 'error');
  }
}

/**
 * Populate form with current config
 */
function populateForm(config) {
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
  
  // Update AI status - always ready since API key is built-in
  updateConnectionStatus('connected', 'AI Ready - Powered by Gemini');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Test connection button
  document.getElementById('test-connection-btn').addEventListener('click', () => testGeminiConnection(true));
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', saveConfiguration);
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetConfiguration);
  
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
  
  // API Test Page (for troubleshooting)
  const testApiBtn = document.getElementById('test-api-btn');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('test-api.html')
      });
      window.close();
    });
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
  const testBtn = document.getElementById('test-connection-btn');
  
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
        action: 'testGeminiConnection'
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
      updateConnectionStatus('connected', 'AI Ready - Powered by Gemini');
      if (showResult) {
        showStatusMessage('✅ Koneksi berhasil! AI siap digunakan.', 'success');
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
    testBtn.innerHTML = '<span>🔗</span> Test Koneksi AI';
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
    // Get form data (no API key needed - it's built-in)
    const newConfig = {
      responseStyle: document.getElementById('response-style').value,
      language: document.getElementById('language').value,
      fillSpeed: document.getElementById('fill-speed').value,
      autoFillEnabled: document.getElementById('auto-fill').checked,
      notifications: document.getElementById('notifications').checked
    };
    
    // Update button state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳</span> Menyimpan...';
    
    // Save configuration
    const success = await configManager.saveConfig(newConfig);
    
    if (success) {
      currentConfig = newConfig;
      showStatusMessage('✅ Konfigurasi berhasil disimpan!', 'success');
      
      // Test AI connection to verify it's still working
      setTimeout(() => testGeminiConnection(false), 500);
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
      
      // Test if content script is loaded
      await testContentScriptConnection(currentTab);
    }
  } catch (error) {
    console.warn('Could not check current tab:', error);
  }
}

/**
 * Test connection to content script
 */
async function testContentScriptConnection(tab) {
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Content script ping timeout'));
      }, 3000);
      
      chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response && response.success) {
      console.log('✅ Content script is ready');
      // Update UI to show content script is ready
      const statusEl = document.getElementById('content-script-status');
      if (statusEl) {
        statusEl.textContent = 'Content Script: Ready';
        statusEl.className = 'status ready';
      }
    }
  } catch (error) {
    console.warn('⚠️ Content script not ready:', error.message);
    // Update UI to show content script needs refresh
    const statusEl = document.getElementById('content-script-status');
    if (statusEl) {
      statusEl.textContent = 'Content Script: Needs Refresh';
      statusEl.className = 'status error';
    }
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
    Fill Form with AI
  `;
  
  currentFormBtn.addEventListener('click', async () => {
    try {
      // Check if tab is still valid
      if (!tab || !tab.id) {
        showStatusMessage('❌ Tab tidak valid', 'error');
        return;
      }
      
      // Check if URL is still Google Form
      const currentTab = await chrome.tabs.get(tab.id);
      if (!currentTab.url || !currentTab.url.includes('docs.google.com/forms/')) {
        showStatusMessage('❌ Halaman bukan Google Form', 'error');
        return;
      }
      
      // Show loading state
      currentFormBtn.disabled = true;
      currentFormBtn.innerHTML = '<span>⏳</span> Processing...';
      showStatusMessage('🤖 AI sedang menganalisis form...', 'info');
      
      // Try to inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['config.js', 'api-protection.js', 'gemini-service.js', 'form-analyzer.js', 'form-filler.js', 'content.js']
        });
        
        // Wait a bit for script to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (injectionError) {
        console.log('Content script might already be injected:', injectionError.message);
      }
      
      // Send message with timeout
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Content script tidak merespons dalam 10 detik'));
        }, 10000);
        
        chrome.tabs.sendMessage(tab.id, { action: 'fillForm', onlyUnanswered: false }, (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && response.success) {
        showStatusMessage('✅ Form berhasil diisi dengan AI!', 'success');
        setTimeout(() => window.close(), 2000);
      } else {
        showStatusMessage('❌ Gagal mengisi form: ' + (response?.error || 'Unknown error'), 'error');
      }
      
    } catch (error) {
      console.error('Error filling form:', error);
      
      let errorMessage = '❌ ';
      if (error.message.includes('Timeout')) {
        errorMessage += 'Content script tidak merespons. Coba refresh halaman form dan ulangi.';
      } else if (error.message.includes('tab')) {
        errorMessage += 'Tidak dapat berkomunikasi dengan tab. Pastikan form masih terbuka.';
      } else if (error.message.includes('Receiving end does not exist')) {
        errorMessage += 'Content script belum siap. Refresh halaman form dan coba lagi.';
      } else {
        errorMessage += 'Tidak dapat berkomunikasi dengan halaman form. ' + error.message;
      }
      
      showStatusMessage(errorMessage, 'error');
    } finally {
      // Reset button
      currentFormBtn.disabled = false;
      currentFormBtn.innerHTML = '<span>⚡</span> Fill Form with AI';
    }
  });
  // Insert after the first quick action
  const firstBtn = quickActions.querySelector('.quick-btn');
  firstBtn.parentNode.insertBefore(currentFormBtn, firstBtn.nextSibling);
}

// Check current tab when popup loads
checkCurrentTab();

console.log('🎯 Autofy popup script loaded');
