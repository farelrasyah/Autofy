/**
 * Google Form Analyzer untuk Autofy Extension
 * Menganalisis dan mengekstrak pertanyaan dari Google Form
 */
class FormAnalyzer {
  constructor() {
    this.questions = [];
    this.formTitle = '';
    this.formDescription = '';
  }

  /**
   * Menganalisis Google Form dan mengekstrak semua pertanyaan
   */
  analyzeForm() {
    try {
      this.extractFormInfo();
      this.extractQuestions();
      return {
        title: this.formTitle,
        description: this.formDescription,
        questions: this.questions,
        totalQuestions: this.questions.length
      };
    } catch (error) {
      console.error('Error analyzing form:', error);
      return null;
    }
  }

  /**
   * Mengekstrak informasi dasar form (judul dan deskripsi)
   */
  extractFormInfo() {
    // Ekstrak judul form
    const titleElement = document.querySelector('[data-docs-text-id] span[dir="auto"]') ||
                        document.querySelector('.freebirdFormviewerViewHeaderTitle') ||
                        document.querySelector('h1');
    
    if (titleElement) {
      this.formTitle = titleElement.textContent?.trim() || '';
    }

    // Ekstrak deskripsi form
    const descriptionElement = document.querySelector('.freebirdFormviewerViewHeaderDescription') ||
                              document.querySelector('.exportFormDescription');
    
    if (descriptionElement) {
      this.formDescription = descriptionElement.textContent?.trim() || '';
    }
  }
  /**
   * Mengekstrak semua pertanyaan dari form
   */
  extractQuestions() {
    this.questions = [];
    console.log('🔍 Starting question extraction...');
      // Enhanced selectors - lebih comprehensive
    const selectors = [
      // Modern Google Forms (2024)
      '[data-params*="question"]',
      '[role="listitem"][data-params]',
      '[jsmodel][data-params]',
      '[data-item-id]',
      // Legacy and alternative selectors
      '.freebirdFormviewerComponentsQuestionBaseRoot',
      '.Qr7Oae',
      '.geS5n',
      '.z12JJ',
      // Additional selectors untuk berbagai layout
      '.freebirdFormviewerViewItemsItemItem',
      '[data-initial-value]',
      '.exportItemContainer',
      // Broad fallback selectors
      'div[data-params]',
      'div[jsmodel]'
    ];
    
    let questionContainers = [];
      // Try each selector with validation
    for (const selector of selectors) {
      try {
        const containers = document.querySelectorAll(selector);
        console.log(`🔍 Selector "${selector}" found ${containers.length} containers`);
        
        if (containers.length > 0) {
          // Filter containers yang benar-benar berisi question
          const validContainers = Array.from(containers).filter(container => {
            return this.isValidQuestionContainer(container);
          });
          
          console.log(`✅ Found ${validContainers.length} valid question containers with "${selector}"`);
          
          if (validContainers.length > 0) {
            questionContainers = validContainers;
            console.log(`🎯 Using selector: "${selector}"`);
            break;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error with selector "${selector}":`, error);
      }
    }
    
    if (questionContainers.length === 0) {
      console.warn('⚠️ No question containers found, trying fallback method...');
      this.extractQuestionsAlternative();
      return;
    }      questionContainers.forEach((container, index) => {
      try {
        console.log(`📝 Extracting question ${index + 1}...`);
        const question = this.extractQuestionFromContainer(container, index);
        
        // More flexible validation for different question types
        const isValidQuestion = question && question.text && (
          question.inputElement || // Has input element
          question.type === 'multiple_choice' || // Multiple choice might not have direct input
          question.options.length > 0 // Has options (for multiple choice/checkbox/dropdown)
        );
        
        if (isValidQuestion) {
          this.questions.push(question);
          console.log(`✅ Question ${index + 1}: "${question.text.substring(0, 50)}..." (${question.type})`);
        } else {
          console.warn(`⚠️ Question ${index + 1} invalid or missing input element:`, {
            hasText: !!question?.text,
            hasInputElement: !!question?.inputElement,
            type: question?.type,
            optionsCount: question?.options?.length || 0
          });
        }
      } catch (error) {
        console.error(`❌ Error extracting question ${index + 1}:`, error);
      }
    });
    
    console.log(`📊 Total questions extracted: ${this.questions.length}`);
  }
  /**
   * Mengekstrak detail pertanyaan dari container
   */
  extractQuestionFromContainer(container, index) {
    console.log(`🔍 Extracting question from container ${index + 1}...`);
    
    // Multiple selectors for question text
    const textSelectors = [
      '[data-docs-text-id] span',
      '[dir="auto"]',
      '.M7eMe',
      '.AgroKb', 
      '.freebirdFormviewerComponentsQuestionBaseTitle',
      'span[jsname]',
      '[role="heading"]',
      '.geS5n',
      'div[data-docs-text-id]'
    ];
    
    let questionTextElement = null;
    let questionText = '';
    
    // Try each selector to find question text
    for (const selector of textSelectors) {
      const elements = container.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent?.trim();
        if (text && text.length > 5 && !text.includes('*') && !text.match(/^\d+$/)) {
          questionTextElement = element;
          questionText = text;
          console.log(`✅ Found question text with selector "${selector}": "${text.substring(0, 50)}..."`);
          break;
        }
      }
      if (questionText) break;
    }

    if (!questionText) {
      console.warn('⚠️ No question text found in container');
      return null;
    }

    // Cek apakah pertanyaan wajib
    const isRequired = container.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk, .vnumgf, [aria-label*="required"], [aria-label*="Required"]') !== null;

    // Tentukan jenis pertanyaan dan ekstrak opsi
    const questionType = this.determineQuestionType(container);
    console.log(`📝 Question type determined: ${questionType}`);
      const options = this.extractOptions(container, questionType);
    let inputElement = this.findInputElement(container, questionType);
    
    // For multiple choice, if no specific input element found, use container as fallback
    if (!inputElement && questionType === 'multiple_choice' && options.length > 0) {
      console.log(`⚠️ No specific input found for multiple choice, using container as fallback`);
      inputElement = container;
    }
    
    console.log(`📝 Input element found: ${!!inputElement}`);
    console.log(`📝 Options found: ${options.length}`);

    return {
      index: index,
      text: questionText,
      type: questionType,
      required: isRequired,
      options: options,
      element: container,
      inputElement: inputElement,
      answered: this.isQuestionAnswered(container, questionType)
    };
  }

  /**
   * Menentukan jenis pertanyaan berdasarkan struktur DOM
   */  determineQuestionType(container) {
    console.log('🔍 Determining question type...');
    
    // Multiple choice (radio buttons) - Enhanced detection
    const multipleChoiceSelectors = [
      'input[type="radio"]',
      '[role="radio"]',
      '.freebirdFormviewerComponentsQuestionRadioChoice',
      '.quantumWizTogglePaperradioEl',
      '.docssharedWizToggleLabeledLabelWrapper',
      '[data-answer-value][role="radio"]'
    ];
    
    for (const selector of multipleChoiceSelectors) {
      if (container.querySelector(selector)) {
        console.log(`✅ Multiple choice detected with selector: ${selector}`);
        return 'multiple_choice';
      }
    }
    
    // Check for multiple choice by looking for multiple radio-like elements
    const radioLikeElements = container.querySelectorAll('[role="radio"], [aria-checked], [data-answer-value]');
    if (radioLikeElements.length > 1) {
      console.log(`✅ Multiple choice detected by multiple radio-like elements: ${radioLikeElements.length}`);
      return 'multiple_choice';
    }

    // Checkbox
    if (container.querySelector('input[type="checkbox"], .freebirdFormviewerComponentsQuestionCheckboxChoice')) {
      return 'checkbox';
    }

    // Dropdown
    if (container.querySelector('select, .quantumWizMenuPaperselectDropDown, [role="listbox"]')) {
      return 'dropdown';
    }

    // Linear scale
    if (container.querySelector('.freebirdFormviewerComponentsQuestionLinearscaleLinearscaleContainer, [data-value][data-answer-value]')) {
      return 'linear_scale';
    }

    // Date
    if (container.querySelector('input[type="date"], .quantumWizTextinputPaperinputInput[aria-label*="Date"], .quantumWizTextinputPaperinputInput[aria-label*="date"]')) {
      return 'date';
    }

    // Time
    if (container.querySelector('input[type="time"], .quantumWizTextinputPaperinputInput[aria-label*="Time"], .quantumWizTextinputPaperinputInput[aria-label*="time"]')) {
      return 'time';
    }

    // Email
    if (container.querySelector('input[type="email"], .quantumWizTextinputPaperinputInput[aria-label*="Email"], .quantumWizTextinputPaperinputInput[aria-label*="email"]')) {
      return 'email';
    }

    // URL
    if (container.querySelector('input[type="url"], .quantumWizTextinputPaperinputInput[aria-label*="URL"], .quantumWizTextinputPaperinputInput[aria-label*="url"]')) {
      return 'url';
    }

    // Number
    if (container.querySelector('input[type="number"], .quantumWizTextinputPaperinputInput[aria-label*="Number"], .quantumWizTextinputPaperinputInput[aria-label*="number"]')) {
      return 'number';
    }

    // Paragraph (textarea)
    if (container.querySelector('textarea, .quantumWizTextinputPapertextareaInput')) {
      return 'paragraph';
    }

    // Short answer (default untuk text input)
    if (container.querySelector('input[type="text"], .quantumWizTextinputPaperinputInput')) {
      return 'short_answer';
    }

    // File upload
    if (container.querySelector('input[type="file"], .freebirdFormviewerComponentsQuestionFileuploadFileuploadContainer')) {
      return 'file_upload';
    }

    return 'short_answer'; // default
  }

  /**
   * Mengekstrak opsi untuk pertanyaan multiple choice/checkbox/dropdown
   */  extractOptions(container, questionType) {
    const options = [];
    console.log(`🔍 Extracting options for type: ${questionType}`);

    if (questionType === 'multiple_choice' || questionType === 'checkbox') {
      // Enhanced option extraction for multiple choice/checkbox
      const optionSelectors = [
        '.freebirdFormviewerComponentsQuestionRadioChoice',
        '.freebirdFormviewerComponentsQuestionCheckboxChoice', 
        '.quantumWizTogglePaperradioEl',
        '.quantumWizTogglePapercheckboxEl',
        '.docssharedWizToggleLabeledLabelWrapper',
        '[role="radio"]',
        '[role="checkbox"]',
        '[data-value]',
        '[data-answer-value]'
      ];
      
      let optionElements = [];
      
      // Try each selector to find option elements
      for (const selector of optionSelectors) {
        optionElements = container.querySelectorAll(selector);
        if (optionElements.length > 0) {
          console.log(`✅ Found ${optionElements.length} options with selector: ${selector}`);
          break;
        }
      }
      
      // Extract text from option elements
      optionElements.forEach((optionEl, index) => {
        const textSelectors = [
          'span[dir="auto"]',
          '.aDTYNe',
          '.eRqjfd',
          '.docssharedWizToggleLabeledContent',
          'label',
          '[aria-label]'
        ];
        
        let optionText = '';
        
        // Try different methods to get option text
        for (const textSelector of textSelectors) {
          const textElement = optionEl.querySelector(textSelector);
          if (textElement && textElement.textContent?.trim()) {
            optionText = textElement.textContent.trim();
            break;
          }
        }
        
        // Fallback to element's own text content
        if (!optionText && optionEl.textContent?.trim()) {
          optionText = optionEl.textContent.trim();
        }
        
        // Fallback to data attributes
        if (!optionText) {
          optionText = optionEl.getAttribute('data-value') || 
                      optionEl.getAttribute('data-answer-value') ||
                      optionEl.getAttribute('aria-label') || '';
        }
        
        if (optionText) {
          options.push(optionText);
          console.log(`  Option ${index + 1}: "${optionText}"`);
        }
      });
      
    } else if (questionType === 'dropdown') {
      // Dropdown options
      const selectElement = container.querySelector('select');
      if (selectElement) {
        const optionElements = selectElement.querySelectorAll('option');
        optionElements.forEach(option => {
          if (option.value && option.textContent?.trim()) {
            options.push(option.textContent.trim());
          }
        });
      }
    } else if (questionType === 'linear_scale') {
      // Linear scale values
      const scaleElements = container.querySelectorAll('[data-value]');
      scaleElements.forEach(scaleEl => {
        const value = scaleEl.getAttribute('data-value');
        if (value) {
          options.push(value);
        }
      });
    }

    console.log(`📝 Total options extracted: ${options.length}`);
    return options;
  }
  /**
   * Mencari elemen input untuk pertanyaan
   */  findInputElement(container, questionType) {
    console.log(`🔍 Finding input element for type: ${questionType}`);
    
    let element = null;
    
    switch (questionType) {
      case 'multiple_choice':
        // Try multiple selectors for radio buttons
        const radioSelectors = [
          'input[type="radio"]',
          '[role="radio"]',
          '.freebirdFormviewerComponentsQuestionRadioChoice input[type="radio"]',
          '.freebirdFormviewerComponentsQuestionRadioChoice [role="radio"]',
          '.quantumWizTogglePaperradioEl input[type="radio"]',
          '.quantumWizTogglePaperradioEl [role="radio"]',
          '.docssharedWizToggleLabeledLabelWrapper input[type="radio"]',
          '[data-answer-value]'
        ];
        
        for (const selector of radioSelectors) {
          element = container.querySelector(selector);
          if (element) {
            console.log(`✅ Found radio input with selector: ${selector}`);
            break;
          }
        }
        
        // If no input found, try to find clickable radio containers
        if (!element) {
          const clickableSelectors = [
            '.freebirdFormviewerComponentsQuestionRadioChoice',
            '.quantumWizTogglePaperradioEl',
            '.docssharedWizToggleLabeledLabelWrapper',
            '[role="radio"]'
          ];
          
          for (const selector of clickableSelectors) {
            const clickableElement = container.querySelector(selector);
            if (clickableElement) {
              console.log(`✅ Found clickable radio container with selector: ${selector}`);
              element = clickableElement; // Use container as fallback
              break;
            }
          }
        }
        
        // Final fallback - use the container itself if it has radio-like characteristics
        if (!element) {
          const hasRadioAttributes = container.querySelector('[aria-checked], [data-value], [data-answer-value]');
          if (hasRadioAttributes) {
            console.log(`✅ Using container with radio attributes as fallback`);
            element = container;
          }
        }
        break;
      
      case 'checkbox':
        element = container.querySelectorAll('input[type="checkbox"]');
        if (element.length === 0) {
          element = container.querySelectorAll('[role="checkbox"]') ||
                   container.querySelectorAll('.freebirdFormviewerComponentsQuestionCheckboxChoice');
        }
        break;
      
      case 'dropdown':
        element = container.querySelector('select') ||
                 container.querySelector('[role="listbox"]') ||
                 container.querySelector('[role="combobox"]') ||
                 container.querySelector('.quantumWizMenuPaperselectDropDown');
        break;
      
      case 'linear_scale':
        element = container.querySelectorAll('[data-value]') ||
                 container.querySelectorAll('[role="radio"][data-answer-value]') ||
                 container.querySelectorAll('.freebirdFormviewerComponentsQuestionLinearscaleLinearscaleContainer [role="radio"]');
        break;
      
      case 'paragraph':
        element = container.querySelector('textarea') ||
                 container.querySelector('.quantumWizTextinputPapertextareaInput') ||
                 container.querySelector('[role="textbox"][aria-multiline="true"]');
        break;
      
      case 'file_upload':
        element = container.querySelector('input[type="file"]') ||
                 container.querySelector('[role="button"][aria-label*="file"]');
        break;
      
      case 'date':
        element = container.querySelector('input[type="date"]') ||
                 container.querySelector('.quantumWizTextinputPaperinputInput[aria-label*="date"]') ||
                 container.querySelector('[data-initial-value][placeholder*="date"]');
        break;
      
      case 'time':
        element = container.querySelector('input[type="time"]') ||
                 container.querySelector('.quantumWizTextinputPaperinputInput[aria-label*="time"]') ||
                 container.querySelector('[data-initial-value][placeholder*="time"]');
        break;
      
      default:
        // For text inputs
        element = container.querySelector('input[type="text"]') ||
                 container.querySelector('input[type="email"]') ||
                 container.querySelector('input[type="url"]') ||
                 container.querySelector('input[type="number"]') ||
                 container.querySelector('.quantumWizTextinputPaperinputInput') ||
                 container.querySelector('[role="textbox"]') ||
                 container.querySelector('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])');
        break;
    }
    
    console.log(`📝 Input element for ${questionType}:`, !!element);
    return element;
  }

  /**
   * Mengecek apakah pertanyaan sudah dijawab
   */
  isQuestionAnswered(container, questionType) {
    switch (questionType) {
      case 'multiple_choice':
        return container.querySelector('input[type="radio"]:checked') !== null;
      
      case 'checkbox':
        return container.querySelector('input[type="checkbox"]:checked') !== null;
      
      case 'dropdown':
        const select = container.querySelector('select');
        return select && select.value !== '';
      
      case 'paragraph':
        const textarea = container.querySelector('textarea');
        return textarea && textarea.value.trim() !== '';
      
      default:
        const input = container.querySelector('input');
        return input && input.value.trim() !== '';
    }
  }

  /**
   * Metode alternatif untuk mengekstrak pertanyaan (fallback)
   */
  extractQuestionsAlternative() {
    const alternativeSelectors = [
      '[data-params*="question"]',
      '.freebirdFormviewerViewItemsItemItem',
      '[role="listitem"]',
      '.Qr7Oae'
    ];

    for (const selector of alternativeSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((el, index) => {
          const question = this.extractQuestionFromContainer(el, index);
          if (question && question.text) {
            this.questions.push(question);
          }
        });
        break;
      }
    }
  }

  /**
   * Mendapatkan pertanyaan berdasarkan index
   */
  getQuestion(index) {
    return this.questions[index] || null;
  }

  /**
   * Mendapatkan pertanyaan yang belum dijawab
   */
  getUnansweredQuestions() {
    return this.questions.filter(q => !q.answered);
  }

  /**
   * Refresh analisis form (untuk form yang dinamis)
   */
  refresh() {
    return this.analyzeForm();
  }

  /**
   * Check if container is a valid question container
   */
  isValidQuestionContainer(container) {
    // Check for question text with multiple selectors
    const questionTextSelectors = [
      '[data-docs-text-id]',
      '[dir="auto"]',
      '.M7eMe',
      '.AgroKb', 
      'span[jsname]',
      '.freebirdFormviewerComponentsQuestionBaseTitle',
      '[role="heading"]',
      '.Elumcf', // Additional selector
      '.exportLabel'
    ];
    
    const hasQuestionText = questionTextSelectors.some(selector => 
      container.querySelector(selector)
    );
    
    // Check for input elements with comprehensive list
    const inputSelectors = [
      'input[type="text"]',
      'input[type="email"]', 
      'input[type="number"]',
      'input[type="url"]',
      'input[type="tel"]',
      'input[type="date"]',
      'input[type="time"]',
      'textarea',
      'select',
      '[role="listbox"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[data-value]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      '.quantumWizTextinputPaperinputInput', // Google Forms specific
      '.quantumWizTextinputPapertextareaInput'
    ];
    
    const hasInput = inputSelectors.some(selector => 
      container.querySelector(selector)
    );
    
    if (!hasQuestionText || !hasInput) {
      console.log('❌ Invalid container:', {
        hasQuestionText,
        hasInput,
        containerHTML: container.outerHTML.substring(0, 200) + '...'
      });
    }
    
    return hasQuestionText && hasInput;
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormAnalyzer;
} else {
  window.FormAnalyzer = FormAnalyzer;
}
