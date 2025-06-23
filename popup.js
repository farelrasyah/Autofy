/**
 * Popup Script untuk Autofy Extension
 * Mengelola interface pengaturan dan kontrol extension
 */

let configManager;
let currentConfig = {};

/**
 * Initialize popup with retry mechanism
 */
function initializePopup() {
  console.log('🎯 Initializing Autofy popup...');
  
  // Check if DOM is ready
  if (document.readyState === 'loading') {
    console.log('⏳ DOM still loading, waiting...');
    document.addEventListener('DOMContentLoaded', initializePopup);
    return;
  }
  
  // Run actual initialization
  runInitialization();
}

/**
 * Run the actual initialization
 */
async function runInitialization() {
  try {
    // Run diagnostics first
    const diagnostics = runDiagnostics();
    
    // Check if required classes are available
    if (typeof ConfigManager === 'undefined') {
      throw new Error('ConfigManager class is not available');
    }
    if (typeof ApiKeyProtection === 'undefined') {
      throw new Error('ApiKeyProtection class is not available');
    }
    
    configManager = new ConfigManager();
    console.log('✅ ConfigManager initialized');
    
    await loadCurrentConfig();
    console.log('✅ Configuration loaded');
    
    setupEventListeners();
    console.log('✅ Event listeners setup');
    
    setupQuickActions();
    console.log('✅ Quick actions setup');
    
    // Check if opened from settings
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('settings') === 'true') {
      showStatusMessage('Pengaturan Autofy', 'info');
    }
    
    console.log('✅ Popup initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing popup:', error);
    console.error('Error stack:', error.stack);
    showStatusMessage(`Error initializing popup: ${error.message}`, 'error');
    
    // Show detailed error info in console
    console.log('Available globals:', {
      ConfigManager: typeof ConfigManager,
      ApiKeyProtection: typeof ApiKeyProtection,
      chrome: typeof chrome
    });
    
    // Run diagnostics to help with debugging
    runDiagnostics();
  }
}

// Initialize immediately if DOM is ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

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
  try {
    // Response style
    const responseStyleSelect = document.getElementById('response-style');
    if (responseStyleSelect) {
      responseStyleSelect.value = config.responseStyle || 'natural';
    } else {
      console.warn('response-style element not found');
    }
    
    // Language
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
      languageSelect.value = config.language || 'id';
    } else {
      console.warn('language element not found');
    }
    
    // Fill speed
    const fillSpeedSelect = document.getElementById('fill-speed');
    if (fillSpeedSelect) {
      fillSpeedSelect.value = config.fillSpeed || 'normal';
    } else {
      console.warn('fill-speed element not found');
    }
    
    // Checkboxes
    const autoFillCheckbox = document.getElementById('auto-fill');
    if (autoFillCheckbox) {
      autoFillCheckbox.checked = config.autoFillEnabled !== false;
    } else {
      console.warn('auto-fill element not found');
    }
    
    const notificationsCheckbox = document.getElementById('notifications');
    if (notificationsCheckbox) {
      notificationsCheckbox.checked = config.notifications !== false;
    } else {
      console.warn('notifications element not found');
    }
    
    // Update AI status - always ready since API key is built-in
    updateConnectionStatus('connected', 'AI Ready - Powered by Gemini');
  } catch (error) {
    console.error('Error populating form:', error);
    throw error;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  try {
    // Test connection button
    const testConnBtn = document.getElementById('test-connection-btn');
    if (testConnBtn) {
      testConnBtn.addEventListener('click', () => testGeminiConnection(true));
    } else {
      console.warn('test-connection-btn element not found');
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveConfiguration);
    } else {
      console.warn('save-btn element not found');
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetConfiguration);
    } else {
      console.warn('reset-btn element not found');
    }
    
    // Form changes
    const formElements = ['response-style', 'language', 'fill-speed', 'auto-fill', 'notifications'];
    formElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', handleFormChange);
      } else {
        console.warn(`Form element '${id}' not found`);
      }
    });
  } catch (error) {
    console.error('Error setting up event listeners:', error);
    throw error;
  }
}

/**
 * Setup quick actions
 */
function setupQuickActions() {
  try {
    // Open Google Form
    const openFormBtn = document.getElementById('open-form-btn');
    if (openFormBtn) {
      openFormBtn.addEventListener('click', () => {
        chrome.tabs.create({
          url: 'https://docs.google.com/forms/'
        });
        window.close();
      });
    } else {
      console.warn('open-form-btn element not found');
    }
    
    // View tutorial
    const tutorialBtn = document.getElementById('view-tutorial-btn');
    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => {
        chrome.tabs.create({
          url: 'https://github.com/your-username/autofy-extension/wiki/Tutorial'
        });
        window.close();
      });
    } else {
      console.warn('view-tutorial-btn element not found');
    }
    
    // API Test Page (for troubleshooting)
    const testApiBtn = document.getElementById('test-api-btn');
    if (testApiBtn) {
      testApiBtn.addEventListener('click', () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('test-api.html')
        });
        window.close();
      });
    } else {
      console.warn('test-api-btn element not found');
    }
  } catch (error) {
    console.error('Error setting up quick actions:', error);
    throw error;
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
  try {
    const connectionStatus = document.getElementById('connection-status');
    if (!connectionStatus) {
      console.warn('connection-status element not found');
      return;
    }
    
    const indicator = connectionStatus.querySelector('.status-indicator');
    const text = connectionStatus.querySelector('span');
    
    if (!indicator || !text) {
      console.warn('connection status child elements not found');
      return;
    }
    
    // Remove all status classes
    indicator.classList.remove('connected', 'disconnected', 'testing');
    
    // Add new status
    indicator.classList.add(status);
    text.textContent = message;
  } catch (error) {
    console.error('Error updating connection status:', error);
  }
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
  try {
    const statusEl = document.getElementById('status-message');
    if (!statusEl) {
      console.warn('status-message element not found');
      console.log('Status message:', message, type);
      return;
    }
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  } catch (error) {
    console.error('Error showing status message:', error);
    console.log('Status message:', message, type);
  }
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

/**
 * Run comprehensive diagnostics
 */
function runDiagnostics() {
  console.log('🔍 Running popup diagnostics...');
  
  const diagnostics = {
    domReady: document.readyState,
    timestamp: new Date().toISOString(),
    globals: {
      ConfigManager: typeof ConfigManager,
      ApiKeyProtection: typeof ApiKeyProtection,
      chrome: typeof chrome
    },
    domElements: {},
    errors: []
  };
  
  // Check required DOM elements
  const requiredElements = [
    'response-style', 'language', 'fill-speed', 'auto-fill', 'notifications',
    'test-connection-btn', 'save-btn', 'reset-btn', 'open-form-btn', 
    'view-tutorial-btn', 'test-api-btn', 'connection-status', 'status-message'
  ];
  
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    diagnostics.domElements[id] = element ? 'found' : 'missing';
  });
  
  // Check connection status sub-elements
  const connectionStatus = document.getElementById('connection-status');
  if (connectionStatus) {
    diagnostics.domElements['connection-status-indicator'] = 
      connectionStatus.querySelector('.status-indicator') ? 'found' : 'missing';
    diagnostics.domElements['connection-status-text'] = 
      connectionStatus.querySelector('span') ? 'found' : 'missing';
  }
  
  // Test class instantiation
  try {
    if (typeof ApiKeyProtection !== 'undefined') {
      const apiProtection = new ApiKeyProtection();
      const apiKey = apiProtection.getApiKey();
      diagnostics.apiKeyLength = apiKey ? apiKey.length : 0;
      diagnostics.apiKeyValid = apiKey && apiKey.length > 10 && apiKey.startsWith('AIza');
    }
  } catch (error) {
    diagnostics.errors.push(`ApiKeyProtection error: ${error.message}`);
  }
  
  try {
    if (typeof ConfigManager !== 'undefined') {
      const configManager = new ConfigManager();
      diagnostics.configManagerCreated = true;
    }
  } catch (error) {
    diagnostics.errors.push(`ConfigManager error: ${error.message}`);
  }
  
  console.log('📊 Popup Diagnostics Results:', diagnostics);
  
  // Create summary
  const missingElements = Object.entries(diagnostics.domElements)
    .filter(([key, value]) => value === 'missing')
    .map(([key]) => key);
  
  if (missingElements.length > 0) {
    console.warn('⚠️ Missing DOM elements:', missingElements);
  }
  
  if (diagnostics.errors.length > 0) {
    console.error('❌ Initialization errors:', diagnostics.errors);
  }
  
  return diagnostics;
}
