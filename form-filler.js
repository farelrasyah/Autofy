/**
 * Form Filler untuk Autofy Extension
 * Mengisi jawaban ke dalam Google Form secara otomatis
 */
class FormFiller {
  constructor() {
    this.fillDelay = 500; // Delay antar pengisian (ms)
    this.typingSpeed = 50; // Kecepatan mengetik (ms per karakter)
  }
  /**
   * Mengisi jawaban untuk satu pertanyaan
   */
  async fillQuestion(question, answer) {
    console.log('📝 FormFiller.fillQuestion called with:', {
      questionType: question?.type,
      questionText: question?.text?.substring(0, 50),
      answer: answer?.substring(0, 50),
      hasInputElement: !!question?.inputElement
    });
    
    if (!question) {
      console.error('❌ Question is null or undefined');
      return false;
    }
    
    if (!question.inputElement) {
      console.error('❌ Question input element not found');
      return false;
    }
    
    if (!answer || answer.trim() === '') {
      console.error('❌ Answer is empty or null');
      return false;
    }

    try {
      await this.delay(this.fillDelay);
      
      console.log(`📝 Filling ${question.type} question with answer: "${answer}"`);
      
      switch (question.type) {
        case 'multiple_choice':
          return await this.fillMultipleChoice(question, answer);
        
        case 'checkbox':
          return await this.fillCheckbox(question, answer);
        
        case 'dropdown':
          return await this.fillDropdown(question, answer);
        
        case 'linear_scale':
          return await this.fillLinearScale(question, answer);
        
        case 'short_answer':
        case 'paragraph':
        case 'email':
        case 'url':
        case 'number':
          return await this.fillTextInput(question, answer);
        
        case 'date':
          return await this.fillDate(question, answer);
        
        case 'time':
          return await this.fillTime(question, answer);
        
        default:
          console.warn(`❌ Unsupported question type: ${question.type}`);
          return false;      }
    } catch (error) {
      console.error(`❌ Error filling question "${question.text?.substring(0, 50)}":`, error);
      console.error('Question details:', question);
      console.error('Answer:', answer);
      console.error('Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Mengisi pertanyaan multiple choice (radio button)
   */
  async fillMultipleChoice(question, answer) {
    const container = question.element;
    const options = container.querySelectorAll('input[type="radio"]');
    
    // Cari opsi yang cocok dengan jawaban
    for (const option of options) {
      const label = this.getOptionLabel(option);
      if (this.isAnswerMatch(label, answer)) {
        await this.clickElement(option);
        await this.delay(200);
        return true;
      }
    }
    
    // Jika tidak ada yang cocok persis, cari yang paling mirip
    const bestMatch = this.findBestMatch(question.options, answer);
    if (bestMatch) {
      for (const option of options) {
        const label = this.getOptionLabel(option);
        if (this.isAnswerMatch(label, bestMatch)) {
          await this.clickElement(option);
          await this.delay(200);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Mengisi pertanyaan checkbox
   */
  async fillCheckbox(question, answer) {
    const container = question.element;
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    // Jika answer adalah array, handle multiple selections
    const answers = Array.isArray(answer) ? answer : [answer];
    let filled = false;
    
    for (const ans of answers) {
      for (const checkbox of checkboxes) {
        const label = this.getOptionLabel(checkbox);
        if (this.isAnswerMatch(label, ans)) {
          if (!checkbox.checked) {
            await this.clickElement(checkbox);
            await this.delay(200);
            filled = true;
          }
        }
      }
    }
    
    return filled;
  }

  /**
   * Mengisi dropdown
   */
  async fillDropdown(question, answer) {
    const container = question.element;
    const select = container.querySelector('select');
    
    if (select) {
      // Standard HTML select
      const options = select.querySelectorAll('option');
      for (const option of options) {
        if (this.isAnswerMatch(option.textContent, answer)) {
          select.value = option.value;
          await this.triggerEvent(select, 'change');
          await this.delay(200);
          return true;
        }
      }
    } else {
      // Google Form custom dropdown
      const dropdownButton = container.querySelector('[role="listbox"], .quantumWizMenuPaperselectDropDown');
      if (dropdownButton) {
        await this.clickElement(dropdownButton);
        await this.delay(300);
        
        // Cari opsi di dropdown yang terbuka
        const dropdownOptions = document.querySelectorAll('[role="option"], .quantumWizMenuPaperselectOption');
        for (const option of dropdownOptions) {
          if (this.isAnswerMatch(option.textContent, answer)) {
            await this.clickElement(option);
            await this.delay(200);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Mengisi linear scale
   */
  async fillLinearScale(question, answer) {
    const container = question.element;
    const scaleButtons = container.querySelectorAll('[data-value], input[type="radio"]');
    
    // Coba cocokkan dengan nilai numerik
    const numericAnswer = parseInt(answer);
    if (!isNaN(numericAnswer)) {
      for (const button of scaleButtons) {
        const value = button.getAttribute('data-value') || button.value;
        if (parseInt(value) === numericAnswer) {
          await this.clickElement(button);
          await this.delay(200);
          return true;
        }
      }
    }
    
    // Fallback: cari berdasarkan label
    for (const button of scaleButtons) {
      const label = this.getOptionLabel(button);
      if (this.isAnswerMatch(label, answer)) {
        await this.clickElement(button);
        await this.delay(200);
        return true;
      }
    }
    
    return false;
  }
  /**
   * Mengisi text input (short answer, paragraph, email, url, number)
   */
  async fillTextInput(question, answer) {
    console.log('📝 fillTextInput called for:', question.type);
    
    let input = question.inputElement;
    if (!input) {
      console.warn('❌ No input element found, trying to find alternative...');
      // Try to find input element again
      const container = question.element;
      input = container.querySelector('input[type="text"], input[type="email"], input[type="url"], input[type="number"], textarea, .quantumWizTextinputPaperinputInput, [role="textbox"]');
      
      if (!input) {
        console.error('❌ Still no input element found');
        return false;
      }
      console.log('✅ Found alternative input element');
    }

    try {
      console.log('📝 Filling input with answer:', answer.substring(0, 50));
      
      // Focus pada input
      await this.focusElement(input);
      await this.delay(100);

      // Clear existing value
      await this.clearInput(input);
      await this.delay(100);

      // Type answer with realistic speed
      if (question.type === 'paragraph') {
        await this.typeText(input, answer, this.typingSpeed);
      } else {
        await this.typeText(input, answer, this.typingSpeed / 2); // Faster for short inputs
      }

      // Trigger events to ensure Google Form recognizes the input
      await this.triggerEvent(input, 'input');
      await this.triggerEvent(input, 'change');
      await this.triggerEvent(input, 'blur');
      await this.delay(200);

      // Verify the value was set
      const currentValue = input.value || input.textContent || '';
      console.log('📝 Current input value after filling:', currentValue.substring(0, 50));
      
      if (currentValue.trim() === '') {
        console.warn('⚠️ Input appears empty after filling, trying direct value assignment...');
        input.value = answer;
        await this.triggerEvent(input, 'input');
        await this.triggerEvent(input, 'change');
      }

      return true;
    } catch (error) {
      console.error('❌ Error filling text input:', error);
      return false;
    }
  }

  /**
   * Mengisi input tanggal
   */
  async fillDate(question, answer) {
    const input = question.inputElement;
    if (!input) return false;

    // Convert answer to date format if needed
    const dateValue = this.parseDate(answer);
    if (!dateValue) return false;

    await this.focusElement(input);
    await this.delay(100);

    input.value = dateValue;
    await this.triggerEvent(input, 'input');
    await this.triggerEvent(input, 'change');
    await this.delay(200);

    return true;
  }

  /**
   * Mengisi input waktu
   */
  async fillTime(question, answer) {
    const input = question.inputElement;
    if (!input) return false;

    // Convert answer to time format if needed
    const timeValue = this.parseTime(answer);
    if (!timeValue) return false;

    await this.focusElement(input);
    await this.delay(100);

    input.value = timeValue;
    await this.triggerEvent(input, 'input');
    await this.triggerEvent(input, 'change');
    await this.delay(200);

    return true;
  }

  /**
   * Helper: Mendapatkan label dari option element
   */
  getOptionLabel(option) {
    // Cari label yang terkait
    const label = option.closest('label') || 
                 option.parentElement?.querySelector('span[dir="auto"]') ||
                 option.nextElementSibling?.querySelector('span') ||
                 option.parentElement?.textContent;
    
    return typeof label === 'string' ? label.trim() : label?.textContent?.trim() || '';
  }

  /**
   * Helper: Mengecek apakah jawaban cocok dengan opsi
   */
  isAnswerMatch(optionText, answer) {
    if (!optionText || !answer) return false;
    
    const option = optionText.toLowerCase().trim();
    const ans = answer.toLowerCase().trim();
    
    // Exact match
    if (option === ans) return true;
    
    // Contains match
    if (option.includes(ans) || ans.includes(option)) return true;
    
    // Similarity check (simple)
    const similarity = this.calculateSimilarity(option, ans);
    return similarity > 0.8;
  }

  /**
   * Helper: Mencari opsi yang paling cocok
   */
  findBestMatch(options, answer) {
    if (!options || options.length === 0 || !answer) return null;
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const option of options) {
      const score = this.calculateSimilarity(option.toLowerCase(), answer.toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        bestMatch = option;
      }
    }
    
    return bestScore > 0.6 ? bestMatch : null;
  }

  /**
   * Helper: Menghitung similarity antara dua string
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Helper: Menghitung Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Helper: Parse tanggal dari string
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Try various date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        // Assume YYYY-MM-DD format for return value
        if (part1.length === 4) {
          return `${part1}-${part2}-${part3}`;
        } else {
          return `${part3}-${part2}-${part1}`;
        }
      }
    }
    
    return null;
  }

  /**
   * Helper: Parse waktu dari string
   */
  parseTime(timeStr) {
    if (!timeStr) return null;
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const [, hours, minutes] = match;
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    return null;
  }

  /**
   * Helper: Click element dengan simulasi human-like
   */
  async clickElement(element) {
    await this.scrollToElement(element);
    await this.delay(100);
    
    // Focus first
    element.focus();
    await this.delay(50);
    
    // Create and dispatch click events
    const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    
    element.dispatchEvent(mouseDown);
    await this.delay(30);
    element.dispatchEvent(mouseUp);
    await this.delay(30);
    element.dispatchEvent(click);
  }
  /**
   * Helper: Focus element
   */
  async focusElement(element) {
    try {
      await this.scrollToElement(element);
      
      // Multiple ways to focus element
      if (element.focus) {
        element.focus();
      }
      
      // Click on element to ensure focus
      await this.clickElement(element);
      
      await this.triggerEvent(element, 'focus');
      console.log('📝 Element focused successfully');
    } catch (error) {
      console.warn('⚠️ Error focusing element:', error);
    }
  }

  /**
   * Helper: Clear input field
   */
  async clearInput(element) {
    try {
      // Multiple methods to clear input
      element.value = '';
      
      if (element.textContent !== undefined) {
        element.textContent = '';
      }
      
      // Simulate selection and deletion
      element.focus();
      element.select();
      
      // Simulate Ctrl+A and Delete
      await this.triggerEvent(element, 'keydown', { key: 'a', ctrlKey: true });
      await this.delay(10);
      await this.triggerEvent(element, 'keydown', { key: 'Delete' });
      await this.triggerEvent(element, 'input');
      await this.delay(10);
      
      console.log('📝 Input cleared successfully');
    } catch (error) {
      console.warn('⚠️ Error clearing input:', error);
    }
  }

  /**
   * Helper: Type text dengan kecepatan realistis
   */
  async typeText(element, text, speed = 50) {
    try {
      console.log(`📝 Typing text: "${text.substring(0, 50)}..." with speed ${speed}ms`);
      
      // Method 1: Character by character typing
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Update value gradually
        element.value = element.value + char;
        
        // Trigger events
        await this.triggerEvent(element, 'keydown', { key: char });
        await this.triggerEvent(element, 'keypress', { key: char });
        await this.triggerEvent(element, 'input');
        await this.triggerEvent(element, 'keyup', { key: char });
        
        await this.delay(speed + Math.random() * 20); // Add some randomness
      }
      
      // Final events
      await this.triggerEvent(element, 'change');
      await this.triggerEvent(element, 'blur');
      
      console.log('📝 Text typed successfully');
    } catch (error) {
      console.warn('⚠️ Error typing text, trying direct assignment:', error);
      
      // Fallback: Direct assignment
      element.value = text;
      await this.triggerEvent(element, 'input');
      await this.triggerEvent(element, 'change');
    }
  }

  /**
   * Helper: Scroll ke element
   */
  async scrollToElement(element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });
    await this.delay(200);
  }

  /**
   * Helper: Trigger event
   */
  async triggerEvent(element, eventType, options = {}) {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
  }

  /**
   * Helper: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mengatur kecepatan pengisian
   */
  setFillSpeed(speed) {
    // speed: 'fast', 'normal', 'slow'
    switch (speed) {
      case 'fast':
        this.fillDelay = 200;
        this.typingSpeed = 20;
        break;
      case 'slow':
        this.fillDelay = 1000;
        this.typingSpeed = 100;
        break;
      default: // normal
        this.fillDelay = 500;
        this.typingSpeed = 50;
    }
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormFiller;
} else {
  window.FormFiller = FormFiller;
}
