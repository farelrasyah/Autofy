/**
 * Real-time Form Filling Debugger
 * Provides real-time debugging tools for form filling issues
 */
class FormFillingDebugger {
  constructor() {
    this.isDebugging = false;
    this.debugLog = [];
    this.originalConsoleLog = console.log;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
  }

  /**
   * Start debugging mode
   */
  startDebugging() {
    this.isDebugging = true;
    this.debugLog = [];
    
    // Create debug UI
    this.createDebugUI();
    
    // Override console methods
    this.interceptConsole();
    
    console.log('🐛 Form Filling Debugger Started');
  }

  /**
   * Stop debugging mode
   */
  stopDebugging() {
    this.isDebugging = false;
    
    // Restore console methods
    this.restoreConsole();
    
    // Remove debug UI
    this.removeDebugUI();
    
    console.log('🐛 Form Filling Debugger Stopped');
  }

  /**
   * Create debug UI overlay
   */
  createDebugUI() {
    // Remove existing debug UI
    this.removeDebugUI();
    
    const debugContainer = document.createElement('div');
    debugContainer.id = 'autofy-debug-container';
    debugContainer.innerHTML = `
      <div id="autofy-debug-panel">
        <div id="autofy-debug-header">
          <h3>🐛 Autofy Form Filling Debugger</h3>
          <div id="autofy-debug-controls">
            <button id="debug-clear-log">Clear Log</button>
            <button id="debug-test-current">Test Current Form</button>
            <button id="debug-analyze-questions">Analyze Questions</button>
            <button id="debug-toggle-minimize">−</button>
            <button id="debug-close">×</button>
          </div>
        </div>
        <div id="autofy-debug-content">
          <div id="autofy-debug-status">Status: Debugging active</div>
          <div id="autofy-debug-log"></div>
        </div>
      </div>
    `;
    
    // Add styles
    const debugStyles = document.createElement('style');
    debugStyles.textContent = `
      #autofy-debug-container {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 600px;
        background: white;
        border: 2px solid #1976d2;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 12px;
      }
      
      #autofy-debug-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      #autofy-debug-header {
        background: #1976d2;
        color: white;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px 6px 0 0;
      }
      
      #autofy-debug-header h3 {
        margin: 0;
        font-size: 14px;
      }
      
      #autofy-debug-controls {
        display: flex;
        gap: 5px;
      }
      
      #autofy-debug-controls button {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      }
      
      #autofy-debug-controls button:hover {
        background: rgba(255,255,255,0.3);
      }
      
      #autofy-debug-content {
        padding: 10px;
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      #autofy-debug-status {
        background: #e3f2fd;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 10px;
        font-weight: bold;
        color: #1976d2;
      }
      
      #autofy-debug-log {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 10px;
        flex: 1;
        overflow-y: auto;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.4;
        max-height: 400px;
      }
      
      .debug-log-entry {
        margin: 2px 0;
        padding: 2px 0;
        border-bottom: 1px solid #eee;
      }
      
      .debug-log-entry:last-child {
        border-bottom: none;
      }
      
      .debug-log-entry.error {
        color: #d32f2f;
        font-weight: bold;
      }
      
      .debug-log-entry.warn {
        color: #f57c00;
      }
      
      .debug-log-entry.success {
        color: #388e3c;
      }
      
      .debug-log-entry.info {
        color: #1976d2;
      }
      
      #autofy-debug-container.minimized #autofy-debug-content {
        display: none;
      }
      
      #autofy-debug-container.minimized {
        height: auto;
      }
    `;
    
    document.head.appendChild(debugStyles);
    document.body.appendChild(debugContainer);
    
    // Add event listeners
    this.addDebugEventListeners();
  }

  /**
   * Add event listeners for debug UI
   */
  addDebugEventListeners() {
    const clearBtn = document.getElementById('debug-clear-log');
    const testBtn = document.getElementById('debug-test-current');
    const analyzeBtn = document.getElementById('debug-analyze-questions');
    const minimizeBtn = document.getElementById('debug-toggle-minimize');
    const closeBtn = document.getElementById('debug-close');
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearDebugLog());
    }
    
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testCurrentForm());
    }
    
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.analyzeQuestions());
    }
    
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.toggleMinimize());
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.stopDebugging());
    }
  }

  /**
   * Remove debug UI
   */
  removeDebugUI() {
    const debugContainer = document.getElementById('autofy-debug-container');
    if (debugContainer) {
      debugContainer.remove();
    }
  }

  /**
   * Intercept console methods for debugging
   */
  interceptConsole() {
    const self = this;
    
    console.log = function(...args) {
      self.addToDebugLog(args.join(' '), 'info');
      self.originalConsoleLog.apply(console, args);
    };
    
    console.warn = function(...args) {
      self.addToDebugLog(args.join(' '), 'warn');
      self.originalConsoleWarn.apply(console, args);
    };
    
    console.error = function(...args) {
      self.addToDebugLog(args.join(' '), 'error');
      self.originalConsoleError.apply(console, args);
    };
  }

  /**
   * Restore original console methods
   */
  restoreConsole() {
    console.log = this.originalConsoleLog;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;
  }

  /**
   * Add entry to debug log
   */
  addToDebugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      timestamp,
      message,
      type
    };
    
    this.debugLog.push(entry);
    this.updateDebugLogDisplay();
    
    // Keep only last 100 entries
    if (this.debugLog.length > 100) {
      this.debugLog = this.debugLog.slice(-100);
    }
  }

  /**
   * Update debug log display
   */
  updateDebugLogDisplay() {
    const logElement = document.getElementById('autofy-debug-log');
    if (!logElement) return;
    
    const logHTML = this.debugLog.map(entry => {
      const className = `debug-log-entry ${entry.type}`;
      return `<div class="${className}">[${entry.timestamp}] ${entry.message}</div>`;
    }).join('');
    
    logElement.innerHTML = logHTML;
    logElement.scrollTop = logElement.scrollHeight;
  }

  /**
   * Clear debug log
   */
  clearDebugLog() {
    this.debugLog = [];
    this.updateDebugLogDisplay();
    this.addToDebugLog('Debug log cleared', 'info');
  }

  /**
   * Test current form
   */
  async testCurrentForm() {
    try {
      this.addToDebugLog('🧪 Starting current form test...', 'info');
      
      // Check if we're on a Google Form
      if (!window.location.href.includes('docs.google.com/forms')) {
        this.addToDebugLog('❌ Not on a Google Form page', 'error');
        return;
      }
      
      // Check if form analyzer is available
      if (typeof FormAnalyzer === 'undefined') {
        this.addToDebugLog('❌ FormAnalyzer not available', 'error');
        return;
      }
      
      // Check if form filler is available
      if (typeof FormFillerEnhanced === 'undefined') {
        this.addToDebugLog('❌ FormFillerEnhanced not available', 'error');
        return;
      }
      
      // Initialize components
      const formAnalyzer = new FormAnalyzer();
      const formFiller = new FormFillerEnhanced();
      
      // Analyze form
      this.addToDebugLog('🔍 Analyzing form...', 'info');
      const questions = await formAnalyzer.analyzeForm();
      
      if (!questions || questions.length === 0) {
        this.addToDebugLog('❌ No questions found in form', 'error');
        return;
      }
      
      this.addToDebugLog(`✅ Found ${questions.length} questions`, 'success');
      
      // Test each question with dummy answers
      const testAnswers = [
        'Test Answer 1',
        'Option A',
        'Yes', 
        'Blue',
        'JavaScript',
        '5',
        'Advanced'
      ];
      
      let successCount = 0;
      
      for (let i = 0; i < questions.length && i < testAnswers.length; i++) {
        const question = questions[i];
        const answer = testAnswers[i % testAnswers.length];
        
        this.addToDebugLog(`📝 Testing Q${i+1}: ${question.type} - "${answer}"`, 'info');
        
        try {
          const success = await formFiller.fillQuestion(question, answer);
          if (success) {
            successCount++;
            this.addToDebugLog(`✅ Q${i+1} filled successfully`, 'success');
          } else {
            this.addToDebugLog(`❌ Q${i+1} failed to fill`, 'error');
          }
        } catch (error) {
          this.addToDebugLog(`❌ Q${i+1} error: ${error.message}`, 'error');
        }
        
        // Small delay between questions
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.addToDebugLog(`📊 Test completed: ${successCount}/${questions.length} successful`, 'info');
      
    } catch (error) {
      this.addToDebugLog(`❌ Test error: ${error.message}`, 'error');
    }
  }

  /**
   * Analyze questions in current form
   */
  async analyzeQuestions() {
    try {
      this.addToDebugLog('🔍 Analyzing questions...', 'info');
      
      if (typeof FormAnalyzer === 'undefined') {
        this.addToDebugLog('❌ FormAnalyzer not available', 'error');
        return;
      }
      
      const formAnalyzer = new FormAnalyzer();
      const questions = await formAnalyzer.analyzeForm();
      
      if (!questions || questions.length === 0) {
        this.addToDebugLog('❌ No questions found', 'error');
        return;
      }
      
      this.addToDebugLog(`✅ Found ${questions.length} questions:`, 'success');
      
      questions.forEach((question, index) => {
        this.addToDebugLog(`  ${index + 1}. Type: ${question.type}`, 'info');
        this.addToDebugLog(`     Text: ${question.text?.substring(0, 50)}...`, 'info');
        this.addToDebugLog(`     Element: ${question.element?.tagName || 'N/A'}`, 'info');
        this.addToDebugLog(`     Input: ${question.inputElement?.tagName || 'N/A'}`, 'info');
        this.addToDebugLog('', 'info');
      });
      
    } catch (error) {
      this.addToDebugLog(`❌ Analysis error: ${error.message}`, 'error');
    }
  }

  /**
   * Toggle minimize state
   */
  toggleMinimize() {
    const container = document.getElementById('autofy-debug-container');
    const button = document.getElementById('debug-toggle-minimize');
    
    if (container && button) {
      container.classList.toggle('minimized');
      button.textContent = container.classList.contains('minimized') ? '+' : '−';
    }
  }

  /**
   * Update debug status
   */
  updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('autofy-debug-status');
    if (statusElement) {
      statusElement.textContent = `Status: ${message}`;
      statusElement.className = `debug-status ${type}`;
    }
  }

  /**
   * Quick test for specific question
   */
  async quickTestQuestion(questionIndex, answer) {
    try {
      if (typeof FormAnalyzer === 'undefined' || typeof FormFillerEnhanced === 'undefined') {
        this.addToDebugLog('❌ Required components not available', 'error');
        return false;
      }
      
      const formAnalyzer = new FormAnalyzer();
      const formFiller = new FormFillerEnhanced();
      
      const questions = await formAnalyzer.analyzeForm();
      
      if (!questions || questionIndex >= questions.length) {
        this.addToDebugLog(`❌ Question ${questionIndex + 1} not found`, 'error');
        return false;
      }
      
      const question = questions[questionIndex];
      this.addToDebugLog(`🎯 Quick test Q${questionIndex + 1}: "${answer}"`, 'info');
      
      const success = await formFiller.fillQuestion(question, answer);
      
      if (success) {
        this.addToDebugLog(`✅ Quick test successful`, 'success');
      } else {
        this.addToDebugLog(`❌ Quick test failed`, 'error');
      }
      
      return success;
      
    } catch (error) {
      this.addToDebugLog(`❌ Quick test error: ${error.message}`, 'error');
      return false;
    }
  }
}

// Create global debugger instance
window.autofyDebugger = window.autofyDebugger || new FormFillingDebugger();

// Add console commands for easy access
window.startDebug = () => window.autofyDebugger.startDebugging();
window.stopDebug = () => window.autofyDebugger.stopDebugging();
window.testForm = () => window.autofyDebugger.testCurrentForm();
window.analyzeForm = () => window.autofyDebugger.analyzeQuestions();
window.quickTest = (questionIndex, answer) => window.autofyDebugger.quickTestQuestion(questionIndex, answer);

// Auto-start debugging if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('debug=true')) {
  console.log('🐛 Auto-starting debugger in development mode');
  // Delay to ensure page is loaded
  setTimeout(() => {
    window.startDebug();
  }, 2000);
}

console.log('🐛 Form Filling Debugger loaded. Use startDebug() to begin.');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormFillingDebugger;
}
