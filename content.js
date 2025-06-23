/**
 * Content Script untuk Autofy Extension
 * Script utama yang berjalan di halaman Google Form
 */

// Import semua komponen yang dibutuhkan
let configManager, geminiService, formAnalyzer, formFiller;
let autofyUI = null;
let isProcessing = false;

/**
 * Inisialisasi Autofy
 */
async function initializeAutofy() {
  try {
    console.log('🚀 Initializing Autofy...');
    console.log('📍 URL:', window.location.href);
    console.log('📍 Is Google Form:', isGoogleFormPage());
    
    // Initialize komponen-komponen
    configManager = new ConfigManager();
    formAnalyzer = new FormAnalyzer();
    formFiller = new FormFiller();
    
    // Load konfigurasi
    const config = await configManager.getConfig();
    console.log('⚙️ Config loaded:', !!config);
    
    // Initialize Gemini service dengan API key
    if (config.geminiApiKey && configManager.isValidApiKey(config.geminiApiKey)) {
      geminiService = new GeminiService(config.geminiApiKey);
      console.log('✅ Gemini service initialized');
    } else {
      console.warn('⚠️ Gemini API key not found or invalid');
      // Try to get API key from protection system
      try {
        if (typeof ApiKeyProtection !== 'undefined') {
          const apiProtection = new ApiKeyProtection();
          const apiKey = apiProtection.getApiKey();
          if (apiKey) {
            geminiService = new GeminiService(apiKey);
            console.log('✅ Gemini service initialized with protected API key');
          }
        }
      } catch (protectionError) {
        console.warn('⚠️ Could not initialize API protection:', protectionError);
      }
    }
    
    // Cek apakah ini halaman Google Form yang valid
    if (isGoogleFormPage()) {
      setupAutofyInterface();
      console.log('✅ Autofy initialized successfully');
      
      // Send ready signal to extension
      chrome.runtime.sendMessage({ action: 'contentScriptReady', url: window.location.href });
    } else {
      console.log('ℹ️ Not a Google Form page, skipping initialization');
    }
    
  } catch (error) {
    console.error('❌ Error initializing Autofy:', error);
    // Send error signal to extension
    chrome.runtime.sendMessage({ action: 'contentScriptError', error: error.message });
  }
}

/**
 * Cek apakah halaman ini adalah Google Form
 */
function isGoogleFormPage() {
  const url = window.location.href;
  const isFormPage = url.includes('docs.google.com/forms/') && 
                    (url.includes('/viewform') || url.includes('/formResponse'));
  
  // Cek juga berdasarkan elemen DOM yang khas Google Form
  const hasFormElements = document.querySelector('.freebirdFormviewerViewFormContent') ||
                         document.querySelector('[data-params*="question"]') ||
                         document.querySelector('.Qr7Oae');
  
  return isFormPage || hasFormElements;
}

/**
 * Setup interface Autofy di halaman
 */
function setupAutofyInterface() {
  // Buat floating button
  createFloatingButton();
  
  // Buat panel kontrol
  createControlPanel();
  
  // Setup observers untuk perubahan DOM
  setupDOMObserver();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
}

/**
 * Buat floating button
 */
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'autofy-floating-btn';
  button.innerHTML = `
    <div class="autofy-btn-icon">🤖</div>
    <div class="autofy-btn-text">Autofy</div>
  `;
  button.title = 'Klik untuk membuka Autofy AI Assistant';
  
  button.addEventListener('click', toggleControlPanel);
  document.body.appendChild(button);
}

/**
 * Buat panel kontrol
 */
function createControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'autofy-control-panel';
  panel.innerHTML = `
    <div class="autofy-header">
      <div class="autofy-title">
        <span class="autofy-icon">🤖</span>
        Autofy AI Assistant
      </div>
      <button class="autofy-close-btn" id="autofy-close">&times;</button>
    </div>
    
    <div class="autofy-content">
      <div class="autofy-status" id="autofy-status">
        <span class="status-icon">⚡</span>
        <span class="status-text">Siap untuk mengisi form</span>
      </div>
      
      <div class="autofy-form-info" id="autofy-form-info">
        <div class="form-title">Memuat informasi form...</div>
        <div class="form-stats">
          <span class="questions-count">0 pertanyaan</span>
          <span class="separator">•</span>
          <span class="answered-count">0 terjawab</span>
        </div>
      </div>
      
      <div class="autofy-controls">
        <div class="control-group">
          <label for="response-style">Gaya Respons:</label>
          <select id="response-style">
            <option value="natural">Natural</option>
            <option value="formal">Formal</option>
            <option value="brief">Singkat</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="fill-speed">Kecepatan Pengisian:</label>
          <select id="fill-speed">
            <option value="normal">Normal</option>
            <option value="fast">Cepat</option>
            <option value="slow">Lambat</option>
          </select>
        </div>
        
        <div class="autofy-buttons">
          <button class="autofy-btn primary" id="analyze-form">
            <span class="btn-icon">🔍</span>
            Analisis Form
          </button>
          
          <button class="autofy-btn primary" id="fill-all" disabled>
            <span class="btn-icon">✨</span>
            Isi Semua Pertanyaan
          </button>
          
          <button class="autofy-btn secondary" id="fill-unanswered" disabled>
            <span class="btn-icon">📝</span>
            Isi Yang Belum Dijawab
          </button>
        </div>
      </div>
      
      <div class="autofy-progress" id="autofy-progress" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-text">Memproses pertanyaan 1 dari 5...</div>
      </div>
      
      <div class="autofy-settings-link">
        <button class="link-btn" id="open-settings">⚙️ Pengaturan</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Setup event listeners
  setupPanelEventListeners();
}

/**
 * Setup event listeners untuk panel
 */
function setupPanelEventListeners() {
  // Close button
  document.getElementById('autofy-close').addEventListener('click', hideControlPanel);
  
  // Analyze form button
  document.getElementById('analyze-form').addEventListener('click', analyzeForm);
  
  // Fill all button
  document.getElementById('fill-all').addEventListener('click', () => fillAllQuestions(false));
  
  // Fill unanswered button
  document.getElementById('fill-unanswered').addEventListener('click', () => fillAllQuestions(true));
  
  // Settings button
  document.getElementById('open-settings').addEventListener('click', openSettings);
  
  // Speed control
  document.getElementById('fill-speed').addEventListener('change', (e) => {
    if (formFiller) {
      formFiller.setFillSpeed(e.target.value);
    }
  });
  
  // Click outside to close
  document.getElementById('autofy-control-panel').addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('autofy-control-panel');
    if (panel && panel.classList.contains('visible') && !panel.contains(e.target)) {
      const floatingBtn = document.getElementById('autofy-floating-btn');
      if (!floatingBtn.contains(e.target)) {
        hideControlPanel();
      }
    }
  });
}

/**
 * Toggle panel kontrol
 */
function toggleControlPanel() {
  const panel = document.getElementById('autofy-control-panel');
  if (panel.classList.contains('visible')) {
    hideControlPanel();
  } else {
    showControlPanel();
  }
}

/**
 * Tampilkan panel kontrol
 */
function showControlPanel() {
  const panel = document.getElementById('autofy-control-panel');
  panel.classList.add('visible');
  
  // Auto analyze form when panel opens
  setTimeout(() => {
    if (!isProcessing) {
      analyzeForm();
    }
  }, 300);
}

/**
 * Sembunyikan panel kontrol
 */
function hideControlPanel() {
  const panel = document.getElementById('autofy-control-panel');
  panel.classList.remove('visible');
}

/**
 * Analisis form
 */
async function analyzeForm() {
  try {
    setStatus('🔍 Menganalisis form...', 'processing');
    
    const formData = formAnalyzer.analyzeForm();
    
    if (!formData || formData.questions.length === 0) {
      setStatus('❌ Tidak dapat menemukan pertanyaan dalam form', 'error');
      return;
    }
    
    // Update form info
    updateFormInfo(formData);
    
    // Enable buttons
    document.getElementById('fill-all').disabled = false;
    document.getElementById('fill-unanswered').disabled = false;
    
    const unansweredCount = formData.questions.filter(q => !q.answered).length;
    setStatus(`✅ Ditemukan ${formData.questions.length} pertanyaan (${unansweredCount} belum dijawab)`, 'success');
    
  } catch (error) {
    console.error('Error analyzing form:', error);
    setStatus('❌ Gagal menganalisis form', 'error');
  }
}

/**
 * Update informasi form di panel
 */
function updateFormInfo(formData) {
  const formInfoEl = document.getElementById('autofy-form-info');
  const answeredCount = formData.questions.filter(q => q.answered).length;
  
  formInfoEl.innerHTML = `
    <div class="form-title">${formData.title || 'Google Form'}</div>
    <div class="form-stats">
      <span class="questions-count">${formData.questions.length} pertanyaan</span>
      <span class="separator">•</span>
      <span class="answered-count">${answeredCount} terjawab</span>
    </div>
  `;
}

/**
 * Isi semua pertanyaan atau hanya yang belum dijawab
 */
async function fillAllQuestions(onlyUnanswered = false) {
  if (!geminiService) {
    setStatus('❌ Gemini API tidak tersedia. Periksa pengaturan.', 'error');
    return;
  }
  
  if (isProcessing) {
    return;
  }
  
  isProcessing = true;
  
  try {
    // Analyze form ulang untuk data terbaru
    const formData = formAnalyzer.analyzeForm();
    if (!formData) {
      throw new Error('Gagal menganalisis form');
    }
    
    // Filter pertanyaan yang perlu diisi
    const questionsToFill = onlyUnanswered 
      ? formData.questions.filter(q => !q.answered)
      : formData.questions;
    
    if (questionsToFill.length === 0) {
      setStatus('✅ Semua pertanyaan sudah dijawab', 'success');
      isProcessing = false;
      return;
    }
    
    // Setup progress
    showProgress();
    const total = questionsToFill.length;
    
    // Get settings
    const config = await configManager.getConfig();
    const responseStyle = document.getElementById('response-style').value;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < questionsToFill.length; i++) {
      const question = questionsToFill[i];
      
      try {
        updateProgress(i + 1, total, `Memproses: ${question.text.substring(0, 50)}...`);
        
        // Generate answer with Gemini
        const context = {
          questionType: question.type,
          options: question.options,
          language: config.language,
          responseStyle: responseStyle
        };
        
        const answer = await geminiService.generateAnswer(question.text, context);
        
        // Fill the answer
        const filled = await formFiller.fillQuestion(question, answer);
        
        if (filled) {
          successCount++;
          console.log(`✅ Filled question ${i + 1}: ${question.text}`);
        } else {
          errorCount++;
          console.warn(`⚠️ Failed to fill question ${i + 1}: ${question.text}`);
        }
        
        // Small delay between questions
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing question ${i + 1}:`, error);
      }
    }
    
    hideProgress();
    
    // Show final status
    if (successCount > 0) {
      setStatus(`✅ Berhasil mengisi ${successCount} pertanyaan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`, 'success');
    } else {
      setStatus(`❌ Gagal mengisi pertanyaan (${errorCount} error)`, 'error');
    }
    
    // Refresh form analysis
    setTimeout(() => {
      analyzeForm();
    }, 1000);
    
  } catch (error) {
    console.error('Error filling questions:', error);
    setStatus('❌ Terjadi kesalahan saat mengisi form', 'error');
    hideProgress();
  } finally {
    isProcessing = false;
  }
}

/**
 * Set status message
 */
function setStatus(message, type = 'info') {
  const statusEl = document.getElementById('autofy-status');
  if (!statusEl) return;
  
  const icons = {
    info: '⚡',
    processing: '⏳',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  statusEl.innerHTML = `
    <span class="status-icon">${icons[type] || icons.info}</span>
    <span class="status-text">${message}</span>
  `;
  
  statusEl.className = `autofy-status ${type}`;
}

/**
 * Show progress bar
 */
function showProgress() {
  const progressEl = document.getElementById('autofy-progress');
  if (progressEl) {
    progressEl.style.display = 'block';
  }
}

/**
 * Hide progress bar
 */
function hideProgress() {
  const progressEl = document.getElementById('autofy-progress');
  if (progressEl) {
    progressEl.style.display = 'none';
  }
}

/**
 * Update progress
 */
function updateProgress(current, total, message) {
  const progressEl = document.getElementById('autofy-progress');
  if (!progressEl) return;
  
  const percentage = (current / total) * 100;
  const fillEl = progressEl.querySelector('.progress-fill');
  const textEl = progressEl.querySelector('.progress-text');
  
  if (fillEl) {
    fillEl.style.width = `${percentage}%`;
  }
  
  if (textEl) {
    textEl.textContent = message || `Memproses pertanyaan ${current} dari ${total}...`;
  }
}

/**
 * Open settings
 */
function openSettings() {
  // Send message to popup/background to open settings
  chrome.runtime.sendMessage({ action: 'openSettings' });
}

/**
 * Setup DOM observer untuk mendeteksi perubahan form
 */
function setupDOMObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldReanalyze = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Cek apakah ada pertanyaan baru atau perubahan form
        const hasFormChanges = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node.querySelector && node.querySelector('[data-params*="question"]'))
        );
        
        if (hasFormChanges) {
          shouldReanalyze = true;
        }
      }
    });
    
    if (shouldReanalyze && !isProcessing) {
      // Debounce reanalysis
      clearTimeout(window.autofyReanalyzeTimeout);
      window.autofyReanalyzeTimeout = setTimeout(() => {
        console.log('🔄 Form changed, re-analyzing...');
        analyzeForm();
      }, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+A: Toggle Autofy panel
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      toggleControlPanel();
    }
    
    // Ctrl+Shift+F: Fill all questions (when panel is open)
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      const panel = document.getElementById('autofy-control-panel');
      if (panel && panel.classList.contains('visible') && !isProcessing) {
        e.preventDefault();
        fillAllQuestions(false);
      }
    }
  });
}

/**
 * Handle messages from popup/background
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message.action);
  
  switch (message.action) {
    case 'analyzeForm':
      try {
        analyzeForm();
        sendResponse({ success: true, message: 'Form analysis started' });
      } catch (error) {
        console.error('Error analyzing form:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'fillForm':
      try {
        console.log('🤖 Starting form filling process...');
        fillAllQuestions(message.onlyUnanswered || false);
        sendResponse({ success: true, message: 'Form filling started' });
      } catch (error) {
        console.error('Error filling form:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'getFormData':
      try {
        if (formAnalyzer) {
          const formData = formAnalyzer.analyzeForm();
          sendResponse({ success: true, formData });
        } else {
          sendResponse({ success: false, error: 'Form analyzer not initialized' });
        }
      } catch (error) {
        console.error('Error getting form data:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'togglePanel':
      try {
        toggleControlPanel();
        sendResponse({ success: true, message: 'Panel toggled' });
      } catch (error) {
        console.error('Error toggling panel:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'ping':
      // Health check
      sendResponse({ success: true, message: 'Content script is alive', timestamp: Date.now() });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action: ' + message.action });
  }
  
  return true; // Keep message channel open for async response
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutofy);
} else {
  initializeAutofy();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.autofyReanalyzeTimeout) {
    clearTimeout(window.autofyReanalyzeTimeout);
  }
});

console.log('🤖 Autofy content script loaded');
