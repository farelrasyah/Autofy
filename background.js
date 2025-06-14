/**
 * Background Script untuk Autofy Extension
 * Service worker yang mengelola komunikasi dan pengaturan extension
 */

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🤖 Autofy Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    showWelcomeNotification();
    setDefaultSettings();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('📦 Autofy Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

/**
 * Show welcome notification
 */
function showWelcomeNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Autofy - AI Form Assistant',
    message: 'Extension berhasil diinstall! Buka Google Form untuk mulai menggunakan Autofy.',
    buttons: [
      { title: 'Buka Pengaturan' },
      { title: 'Tutorial' }
    ]
  });
}

/**
 * Set default settings
 */
async function setDefaultSettings() {
  try {
    const configManager = new ConfigManager();
    await configManager.saveConfig({
      autoFillEnabled: true,
      responseStyle: 'natural',
      language: 'id',
      fillSpeed: 'normal',
      notifications: true
    });
    console.log('✅ Default settings saved');
  } catch (error) {
    console.error('❌ Error saving default settings:', error);
  }
}

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if current tab is Google Form
    if (tab.url && tab.url.includes('docs.google.com/forms/')) {
      // Send message to content script to toggle panel
      chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Could not communicate with content script:', chrome.runtime.lastError.message);
          // Try to inject content script if not already present
          injectContentScript(tab.id);
        }
      });
    } else {
      // Not a Google Form page, show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Autofy',
        message: 'Buka halaman Google Form untuk menggunakan Autofy.'
      });
    }
  } catch (error) {
    console.error('Error handling icon click:', error);
  }
});

/**
 * Inject content script manually
 */
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['config.js', 'gemini-service.js', 'form-analyzer.js', 'form-filler.js', 'content.js']
    });
    
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['styles.css']
    });
    
    console.log('✅ Content script injected');
  } catch (error) {
    console.error('❌ Error injecting content script:', error);
  }
}

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received message:', message);
  
  switch (message.action) {
    case 'openSettings':
      openSettingsPage();
      sendResponse({ success: true });
      break;
      
    case 'getConfig':
      getExtensionConfig().then(config => {
        sendResponse({ config });
      });
      return true; // Async response
      
    case 'saveConfig':
      saveExtensionConfig(message.config).then(success => {
        sendResponse({ success });
      });
      return true; // Async response
      
    case 'testGeminiConnection':
      testGeminiConnection(message.apiKey).then(result => {
        sendResponse(result);
      });
      return true; // Async response
      
    case 'showNotification':
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: message.title || 'Autofy',
        message: message.message
      });
      sendResponse({ success: true });
      break;
      
    case 'getBadgeText':
      chrome.action.getBadgeText({ tabId: sender.tab?.id }, (text) => {
        sendResponse({ badgeText: text });
      });
      return true; // Async response
      
    case 'setBadgeText':
      if (sender.tab?.id) {
        chrome.action.setBadgeText({
          tabId: sender.tab.id,
          text: message.text || ''
        });
        chrome.action.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: message.color || '#667eea'
        });
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Open settings page
 */
function openSettingsPage() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('popup.html') + '?settings=true'
  });
}

/**
 * Get extension configuration
 */
async function getExtensionConfig() {
  try {
    const result = await chrome.storage.sync.get(['autofy_config']);
    return result.autofy_config || {};
  } catch (error) {
    console.error('Error getting config:', error);
    return {};
  }
}

/**
 * Save extension configuration
 */
async function saveExtensionConfig(config) {
  try {
    await chrome.storage.sync.set({ autofy_config: config });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

/**
 * Test Gemini connection
 */
async function testGeminiConnection(apiKey) {
  try {
    if (!apiKey || apiKey.length < 20) {
      return { success: false, error: 'Invalid API key' };
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test connection' }] }]
        })
      }
    );
    
    if (response.ok) {
      return { success: true, message: 'Connection successful' };
    } else {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || 'Connection failed' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Network error' 
    };
  }
}

/**
 * Handle tab updates to manage extension state
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a Google Form page
    if (tab.url.includes('docs.google.com/forms/')) {
      // Set badge to indicate extension is active
      chrome.action.setBadgeText({ tabId, text: '✓' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#28a745' });
      chrome.action.setTitle({ 
        tabId, 
        title: 'Autofy is ready! Click to open or use Ctrl+Shift+A' 
      });
    } else {
      // Clear badge for non-form pages
      chrome.action.setBadgeText({ tabId, text: '' });
      chrome.action.setTitle({ 
        tabId, 
        title: 'Autofy - Open a Google Form to use this extension' 
      });
    }
  }
});

/**
 * Handle notification clicks
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.notifications.clear(notificationId);
  
  if (buttonIndex === 0) {
    // Open settings
    openSettingsPage();
  } else if (buttonIndex === 1) {
    // Open tutorial
    chrome.tabs.create({
      url: 'https://github.com/your-username/autofy-extension/wiki/Tutorial'
    });
  }
});

/**
 * Context menu setup
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'autofy-analyze',
    title: 'Analisis form dengan Autofy',
    contexts: ['page'],
    documentUrlPatterns: ['*://docs.google.com/forms/*']
  });
  
  chrome.contextMenus.create({
    id: 'autofy-fill',
    title: 'Isi form dengan AI',
    contexts: ['page'],
    documentUrlPatterns: ['*://docs.google.com/forms/*']
  });
  
  chrome.contextMenus.create({
    id: 'autofy-settings',
    title: 'Pengaturan Autofy',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'autofy-analyze':
      chrome.tabs.sendMessage(tab.id, { action: 'analyzeForm' });
      break;
      
    case 'autofy-fill':
      chrome.tabs.sendMessage(tab.id, { action: 'fillForm', onlyUnanswered: true });
      break;
      
    case 'autofy-settings':
      openSettingsPage();
      break;
  }
});

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('🤖 Autofy Extension started');
});

/**
 * Keep service worker alive
 */
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

console.log('🤖 Autofy background script loaded');
