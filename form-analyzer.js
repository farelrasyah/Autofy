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
    
    // Selector untuk container pertanyaan Google Form
    const questionContainers = document.querySelectorAll('[data-params*="question"] .freebirdFormviewerComponentsQuestionBaseRoot, .Qr7Oae, [role="listitem"][data-params]');
    
    questionContainers.forEach((container, index) => {
      try {
        const question = this.extractQuestionFromContainer(container, index);
        if (question && question.text) {
          this.questions.push(question);
        }
      } catch (error) {
        console.warn(`Error extracting question ${index}:`, error);
      }
    });

    // Fallback: cari dengan selector alternatif
    if (this.questions.length === 0) {
      this.extractQuestionsAlternative();
    }
  }

  /**
   * Mengekstrak detail pertanyaan dari container
   */
  extractQuestionFromContainer(container, index) {
    // Ekstrak teks pertanyaan
    const questionTextElement = container.querySelector('[data-docs-text-id] span, .freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, .AgroKb') ||
                               container.querySelector('[dir="auto"]') ||
                               container.querySelector('span[jsname]');
    
    if (!questionTextElement) return null;

    const questionText = questionTextElement.textContent?.trim();
    if (!questionText) return null;

    // Cek apakah pertanyaan wajib
    const isRequired = container.querySelector('.freebirdFormviewerComponentsQuestionBaseRequiredAsterisk, .vnumgf') !== null;

    // Tentukan jenis pertanyaan dan ekstrak opsi
    const questionType = this.determineQuestionType(container);
    const options = this.extractOptions(container, questionType);
    const inputElement = this.findInputElement(container, questionType);

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
    switch (questionType) {
      case 'multiple_choice':
        return container.querySelector('input[type="radio"]');
      
      case 'checkbox':
        return container.querySelectorAll('input[type="checkbox"]');
      
      case 'dropdown':
        return container.querySelector('select, [role="listbox"]');
      
      case 'linear_scale':
        return container.querySelectorAll('[data-value]');
      
      case 'paragraph':
        return container.querySelector('textarea, .quantumWizTextinputPapertextareaInput');
      
      case 'file_upload':
        return container.querySelector('input[type="file"]');
      
      default:
        return container.querySelector('input[type="text"], input[type="email"], input[type="url"], input[type="number"], input[type="date"], input[type="time"], .quantumWizTextinputPaperinputInput');
    }
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
