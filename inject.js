/**
 * Inject Script untuk Autofy Extension
 * Script yang diinjeksikan ke dalam halaman untuk akses DOM yang lebih dalam
 */

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.autofyInjected) {
    return;
  }
  window.autofyInjected = true;
  
  console.log('🔧 Autofy inject script loaded');
  
  /**
   * Enhanced form detection untuk Google Forms
   */
  function enhancedFormDetection() {
    const indicators = [
      // URL patterns
      () => window.location.href.includes('docs.google.com/forms/'),
      
      // DOM elements
      () => document.querySelector('.freebirdFormviewerViewFormContent'),
      () => document.querySelector('[data-params*="question"]'),
      () => document.querySelector('.Qr7Oae'),
      
      // Meta tags
      () => document.querySelector('meta[content*="Google Forms"]'),
      
      // JavaScript variables
      () => window.FB_PUBLIC_LOAD_DATA_ !== undefined
    ];
    
    return indicators.some(check => {
      try {
        return check();
      } catch (e) {
        return false;
      }
    });
  }
  
  /**
   * Deep DOM observer untuk perubahan dinamis
   */
  function setupDeepObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Notify content script tentang perubahan form
              if (node.querySelector && (
                node.querySelector('[data-params*="question"]') ||
                node.classList?.contains('freebirdFormviewerComponentsQuestionBaseRoot')
              )) {
                window.postMessage({
                  type: 'AUTOFY_FORM_CHANGED',
                  source: 'inject',
                  timestamp: Date.now()
                }, '*');
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    return observer;
  }
  
  /**
   * Enhanced event simulation untuk Google Forms
   */
  function enhancedEventSimulation() {
    window.autofyTriggerEvent = function(element, eventType, options = {}) {
      const events = [];
      
      switch (eventType) {
        case 'click':
          events.push(new MouseEvent('mousedown', { bubbles: true, cancelable: true, ...options }));
          events.push(new MouseEvent('mouseup', { bubbles: true, cancelable: true, ...options }));
          events.push(new MouseEvent('click', { bubbles: true, cancelable: true, ...options }));
          break;
          
        case 'input':
          events.push(new Event('input', { bubbles: true, cancelable: true, ...options }));
          events.push(new Event('change', { bubbles: true, cancelable: true, ...options }));
          break;
          
        case 'focus':
          events.push(new FocusEvent('focus', { bubbles: true, cancelable: true, ...options }));
          break;
          
        default:
          events.push(new Event(eventType, { bubbles: true, cancelable: true, ...options }));
      }
      
      events.forEach(event => {
        try {
          element.dispatchEvent(event);
        } catch (e) {
          console.warn('Event dispatch failed:', e);
        }
      });
    };
  }
  
  /**
   * Google Forms specific helpers
   */
  function setupGoogleFormsHelpers() {
    // Helper untuk mendapatkan form data
    window.autofyGetFormData = function() {
      try {
        // Coba ekstrak dari JavaScript variables Google Forms
        if (window.FB_PUBLIC_LOAD_DATA_) {
          const loadData = window.FB_PUBLIC_LOAD_DATA_;
          return {
            formId: loadData[1]?.[14],
            formTitle: loadData[1]?.[8],
            formDescription: loadData[1]?.[0],
            questions: loadData[1]?.[1] || []
          };
        }
        return null;
      } catch (e) {
        console.warn('Could not extract form data:', e);
        return null;
      }
    };
    
    // Helper untuk mendapatkan question elements yang lebih akurat
    window.autofyGetQuestionElements = function() {
      const selectors = [
        '.freebirdFormviewerComponentsQuestionBaseRoot',
        '[data-params*="question"]',
        '.Qr7Oae',
        '[role="listitem"][data-params]'
      ];
      
      let elements = [];
      
      for (const selector of selectors) {
        elements = Array.from(document.querySelectorAll(selector));
        if (elements.length > 0) break;
      }
      
      return elements.filter(el => {
        // Filter out non-question elements
        const text = el.textContent?.trim();
        return text && text.length > 0 && !text.match(/^(Submit|Next|Previous|Clear form)$/i);
      });
    };
    
    // Helper untuk Google Forms validation bypass
    window.autofyBypassValidation = function(element) {
      try {
        // Remove required attribute temporarily
        const wasRequired = element.hasAttribute('required');
        if (wasRequired) {
          element.removeAttribute('required');
        }
        
        // Trigger validation events
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('invalid', { bubbles: true }));
        
        // Restore required attribute
        if (wasRequired) {
          element.setAttribute('required', 'required');
        }
        
        return true;
      } catch (e) {
        console.warn('Validation bypass failed:', e);
        return false;
      }
    };
  }
  
  /**
   * Performance monitoring
   */
  function setupPerformanceMonitoring() {
    let actionCount = 0;
    let startTime = Date.now();
    
    window.autofyPerformance = {
      logAction: function(action) {
        actionCount++;
        console.log(`🎯 Autofy Action ${actionCount}: ${action} (${Date.now() - startTime}ms)`);
      },
      
      getStats: function() {
        return {
          actionsPerformed: actionCount,
          totalTime: Date.now() - startTime,
          averageTimePerAction: actionCount > 0 ? (Date.now() - startTime) / actionCount : 0
        };
      },
      
      reset: function() {
        actionCount = 0;
        startTime = Date.now();
      }
    };
  }
  
  /**
   * Error handling dan reporting
   */
  function setupErrorHandling() {
    window.autofyReportError = function(error, context = '') {
      const errorData = {
        message: error.message || error,
        stack: error.stack,
        context: context,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      // Send to content script
      window.postMessage({
        type: 'AUTOFY_ERROR',
        source: 'inject',
        error: errorData
      }, '*');
    };
    
    // Global error handler
    window.addEventListener('error', (event) => {
      if (event.filename?.includes('autofy') || event.message?.includes('autofy')) {
        window.autofyReportError(event.error, 'Global error handler');
      }
    });
  }
  
  // Initialize inject script
  if (enhancedFormDetection()) {
    console.log('✅ Google Form detected, initializing enhanced features...');
    
    setupDeepObserver();
    enhancedEventSimulation();
    setupGoogleFormsHelpers();
    setupPerformanceMonitoring();
    setupErrorHandling();
    
    // Notify content script that inject script is ready
    window.postMessage({
      type: 'AUTOFY_INJECT_READY',
      source: 'inject',
      timestamp: Date.now()
    }, '*');
    
    console.log('🚀 Autofy inject script initialized successfully');
  } else {
    console.log('ℹ️ Not a Google Form page, inject script dormant');
  }
  
  // Expose utilities globally
  window.autofy = window.autofy || {};
  window.autofy.inject = {
    version: '1.0.0',
    isGoogleForm: enhancedFormDetection(),
    utils: {
      getFormData: window.autofyGetFormData,
      getQuestionElements: window.autofyGetQuestionElements,
      triggerEvent: window.autofyTriggerEvent,
      bypassValidation: window.autofyBypassValidation,
      reportError: window.autofyReportError
    },
    performance: window.autofyPerformance
  };
  
})();
