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
    
    // Multiple selectors for different Google Form layouts
    const selectors = [
      // Modern Google Forms
      '[data-params*="question"]',
      '[role="listitem"][data-params]',
      '[jsmodel][data-params]',
      // Legacy selectors
      '.freebirdFormviewerComponentsQuestionBaseRoot',
      '.Qr7Oae',
      // Alternative selectors
      '[data-item-id]',
      '.geS5n',
      '.z12JJ'
    ];
    
    let questionContainers = [];
    
    // Try each selector until we find questions
    for (const selector of selectors) {
      questionContainers = document.querySelectorAll(selector);
      console.log(`🔍 Selector "${selector}" found ${questionContainers.length} containers`);
      
      if (questionContainers.length > 0) {
        // Filter containers that actually contain questions
        const validContainers = Array.from(questionContainers).filter(container => {
          const hasQuestionText = container.querySelector('[data-docs-text-id], [dir="auto"], .M7eMe, .AgroKb, span[jsname]');
          const hasInput = container.querySelector('input, textarea, select, [role="listbox"], [data-value]');
          return hasQuestionText && hasInput;
        });
        
        console.log(`🔍 Found ${validContainers.length} valid question containers`);
        
        if (validContainers.length > 0) {
          questionContainers = validContainers;
          break;
        }
      }
    }
    
    if (questionContainers.length === 0) {
      console.warn('⚠️ No question containers found, trying fallback method...');
      this.extractQuestionsAlternative();
      return;
    }
    
    questionContainers.forEach((container, index) => {
      try {
        console.log(`📝 Extracting question ${index + 1}...`);
        const question = this.extractQuestionFromContainer(container, index);
        if (question && question.text) {
          this.questions.push(question);
          console.log(`✅ Question ${index + 1}: "${question.text.substring(0, 50)}..." (${question.type})`);
        } else {
          console.warn(`⚠️ Question ${index + 1}: Failed to extract`);
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
    const inputElement = this.findInputElement(container, questionType);
    
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
   */
  determineQuestionType(container) {
    // Multiple choice (radio buttons)
    if (container.querySelector('input[type="radio"], .freebirdFormviewerComponentsQuestionRadioChoice')) {
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
   */
  extractOptions(container, questionType) {
    const options = [];

    if (questionType === 'multiple_choice' || questionType === 'checkbox') {
      // Radio buttons atau checkboxes
      const optionElements = container.querySelectorAll('.freebirdFormviewerComponentsQuestionRadioChoice, .freebirdFormviewerComponentsQuestionCheckboxChoice, [data-value]');
      
      optionElements.forEach(optionEl => {
        const textElement = optionEl.querySelector('span[dir="auto"], .aDTYNe, .eRqjfd');
        if (textElement && textElement.textContent?.trim()) {
          options.push(textElement.textContent.trim());
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

    return options;
  }
  /**
   * Mencari elemen input untuk pertanyaan
   */
  findInputElement(container, questionType) {
    console.log(`🔍 Finding input element for type: ${questionType}`);
    
    let element = null;
    
    switch (questionType) {
      case 'multiple_choice':
        element = container.querySelector('input[type="radio"]') ||
                 container.querySelector('[role="radio"]') ||
                 container.querySelector('.freebirdFormviewerComponentsQuestionRadioChoice');
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
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormAnalyzer;
} else {
  window.FormAnalyzer = FormAnalyzer;
}
