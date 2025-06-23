/**
 * Form Filler untuk Autofy Extension - Enhanced Multiple Choice Support
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
      
      // Route ke method yang tepat berdasarkan tipe pertanyaan
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
          return false;
      }
    } catch (error) {
      console.error(`❌ Error filling question "${question.text?.substring(0, 50)}":`, error);
      console.error('Question details:', question);
      console.error('Answer:', answer);
      console.error('Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Mengisi pertanyaan multiple choice (radio button) - Enhanced
   */
  async fillMultipleChoice(question, answer) {
    console.log(`🔘 Filling multiple choice: "${answer}"`);
    const container = question.element;
    
    // Enhanced selectors untuk radio buttons dan custom Google Forms elements
    const radioSelectors = [
      'input[type="radio"]',
      '[role="radio"]',
      '[data-value][role="radio"]',
      '.quantumWizTogglePaperradioRoot input',
      '.freebirdFormviewerComponentsQuestionRadioChoice input',
      '.freebirdFormviewerComponentsQuestionRadioChoice [role="radio"]',
      '[aria-checked]'
    ];
    
    let options = [];
    for (const selector of radioSelectors) {
      options = container.querySelectorAll(selector);
      if (options.length > 0) {
        console.log(`✅ Found ${options.length} radio options with selector: ${selector}`);
        break;
      }
    }
    
    if (options.length === 0) {
      console.warn('❌ No radio options found, trying alternative approach...');
      return await this.fillMultipleChoiceAlternative(container, answer);
    }
    
    // Try exact match first
    for (const option of options) {
      const label = this.getOptionLabel(option);
      console.log(`🔍 Checking option: "${label}"`);
      
      if (this.isAnswerMatch(label, answer)) {
        console.log(`✅ Exact match found: "${label}"`);
        const success = await this.selectRadioOption(option);
        if (success) return true;
      }
    }
    
    // Try partial match if no exact match
    for (const option of options) {
      const label = this.getOptionLabel(option);
      if (this.isPartialMatch(label, answer)) {
        console.log(`🎯 Partial match found: "${label}"`);
        const success = await this.selectRadioOption(option);
        if (success) return true;
      }
    }
    
    // If no match found, select first option as fallback
    if (options.length > 0) {
      console.log(`🔄 No match found, selecting first option as fallback`);
      const success = await this.selectRadioOption(options[0]);
      if (success) return true;
    }
    
    return false;
  }

  /**
   * Alternative approach for multiple choice when standard selectors fail
   */
  async fillMultipleChoiceAlternative(container, answer) {
    console.log('🔄 Trying alternative multiple choice approach...');
    
    // Look for clickable elements that might be custom radio buttons
    const clickableSelectors = [
      '[data-value]',
      '.freebirdFormviewerComponentsQuestionRadioChoice',
      '.quantumWizTogglePaperradioRoot',
      '[role="button"]',
      'div[data-params]'
    ];
    
    for (const selector of clickableSelectors) {
      const elements = container.querySelectorAll(selector);
      console.log(`🔍 Found ${elements.length} elements with ${selector}`);
      
      for (const element of elements) {
        const text = element.textContent?.trim() || element.getAttribute('data-value') || '';
        console.log(`🔍 Checking clickable element: "${text}"`);
        
        if (this.isAnswerMatch(text, answer) || this.isPartialMatch(text, answer)) {
          console.log(`✅ Match found in clickable element: "${text}"`);
          
          // Try clicking the element
          try {
            element.focus();
            await this.delay(100);
            element.click();
            await this.delay(300);
            
            // Check if selection was successful by looking for visual indicators
            if (element.getAttribute('aria-checked') === 'true' || 
                element.classList.contains('selected') ||
                element.classList.contains('checked')) {
              console.log('✅ Selection successful');
              return true;
            }
          } catch (error) {
            console.warn('⚠️ Error clicking element:', error);
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Enhanced radio option selection with proper event triggering
   */
  async selectRadioOption(option) {
    try {
      // Focus on the element first
      option.focus();
      await this.delay(100);
      
      // Check if already selected
      if (option.checked || option.getAttribute('aria-checked') === 'true') {
        console.log('🎯 Option already selected');
        return true;
      }
      
      // Try direct property setting for input elements
      if (option.type === 'radio') {
        option.checked = true;
      }
      
      // Set aria-checked for ARIA elements
      if (option.hasAttribute('aria-checked')) {
        option.setAttribute('aria-checked', 'true');
      }
      
      // Trigger all necessary events
      const events = ['mousedown', 'mouseup', 'click', 'change', 'input'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        option.dispatchEvent(event);
        await this.delay(50);
      }
      
      // Also try clicking the parent label or container if it exists
      const label = option.closest('label') || 
                   option.parentElement.querySelector('label') ||
                   document.querySelector(`label[for="${option.id}"]`) ||
                   option.closest('.freebirdFormviewerComponentsQuestionRadioChoice');
      
      if (label && label !== option) {
        console.log('🔗 Clicking associated label/container');
        label.click();
        await this.delay(100);
      }
      
      // Verify selection
      if (option.checked || option.getAttribute('aria-checked') === 'true') {
        console.log('✅ Radio option successfully selected');
        return true;
      } else {
        console.warn('⚠️ Radio option not selected after events');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error selecting radio option:', error);
      return false;
    }
  }

  /**
   * Mengisi pertanyaan checkbox - Enhanced
   */
  async fillCheckbox(question, answer) {
    console.log(`☑️ Filling checkbox: "${answer}"`);
    const container = question.element;
    
    const checkboxSelectors = [
      'input[type="checkbox"]',
      '[role="checkbox"]',
      '.quantumWizTogglePapercheckboxRoot input',
      '.freebirdFormviewerComponentsQuestionCheckboxChoice input'
    ];
    
    let checkboxes = [];
    for (const selector of checkboxSelectors) {
      checkboxes = container.querySelectorAll(selector);
      if (checkboxes.length > 0) break;
    }
    
    // Jika answer adalah array, handle multiple selections
    const answers = Array.isArray(answer) ? answer : [answer];
    let filled = false;
    
    for (const ans of answers) {
      for (const checkbox of checkboxes) {
        const label = this.getOptionLabel(checkbox);
        if (this.isAnswerMatch(label, ans) || this.isPartialMatch(label, ans)) {
          if (!checkbox.checked) {
            await this.selectCheckboxOption(checkbox);
            filled = true;
          }
        }
      }
    }
    
    return filled;
  }

  /**
   * Select checkbox option with proper event handling
   */
  async selectCheckboxOption(checkbox) {
    try {
      checkbox.focus();
      await this.delay(100);
      
      checkbox.checked = true;
      
      const events = ['mousedown', 'mouseup', 'click', 'change', 'input'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        checkbox.dispatchEvent(event);
        await this.delay(50);
      }
      
      const label = checkbox.closest('label') || 
                   document.querySelector(`label[for="${checkbox.id}"]`);
      if (label) {
        label.click();
        await this.delay(100);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error selecting checkbox:', error);
      return false;
    }
  }

  /**
   * Mengisi dropdown - Enhanced untuk Google Forms
   */
  async fillDropdown(question, answer) {
    console.log(`📋 Filling dropdown: "${answer}"`);
    const container = question.element;
    
    // Try standard HTML select first
    const select = container.querySelector('select');
    
    if (select) {
      console.log('🎯 Found standard HTML select');
      const options = select.querySelectorAll('option');
      for (const option of options) {
        if (this.isAnswerMatch(option.textContent, answer)) {
          select.value = option.value;
          select.selectedIndex = option.index;
          
          // Trigger events
          const events = ['change', 'input', 'blur'];
          for (const eventType of events) {
            const event = new Event(eventType, { bubbles: true });
            select.dispatchEvent(event);
            await this.delay(50);
          }
          
          console.log(`✅ Selected option: "${option.textContent}"`);
          return true;
        }
      }
    }
    
    // Google Forms custom dropdown
    const dropdownSelectors = [
      '[role="listbox"]',
      '[data-value]',
      '.quantumWizMenuPaperselectDropDown',
      '.freebirdFormviewerComponentsQuestionSelectRoot',
      '.exportSelect'
    ];
    
    let dropdown = null;
    for (const selector of dropdownSelectors) {
      dropdown = container.querySelector(selector);
      if (dropdown) {
        console.log(`✅ Found custom dropdown with selector: ${selector}`);
        break;
      }
    }
    
    if (dropdown) {
      // Click to open dropdown
      dropdown.click();
      await this.delay(500);
      
      // Find dropdown options (they might appear outside the container)
      const optionSelectors = [
        '[role="option"]',
        '.quantumWizMenuPaperselectOption',
        '.freebirdFormviewerComponentsQuestionSelectOption',
        '[data-value]'
      ];
      
      let options = [];
      for (const selector of optionSelectors) {
        options = document.querySelectorAll(selector + ':not([style*="display: none"])');
        if (options.length > 0) {
          console.log(`✅ Found ${options.length} dropdown options`);
          break;
        }
      }
      
      // Try to select matching option
      for (const option of options) {
        const optionText = option.textContent?.trim() || option.getAttribute('data-value') || '';
        console.log(`🔍 Checking dropdown option: "${optionText}"`);
        
        if (this.isAnswerMatch(optionText, answer)) {
          console.log(`✅ Match found: "${optionText}"`);
          option.click();
          await this.delay(300);
          return true;
        }
      }
      
      // If no exact match, try partial match
      for (const option of options) {
        const optionText = option.textContent?.trim() || '';
        if (this.isPartialMatch(optionText, answer)) {
          console.log(`🎯 Partial match found: "${optionText}"`);
          option.click();
          await this.delay(300);
          return true;
        }
      }
      
      // Close dropdown if no match found
      document.body.click();
      await this.delay(200);
    }
    
    console.warn('❌ No dropdown options found or matched');
    return false;
  }

  /**
   * Mengisi linear scale
   */
  async fillLinearScale(question, answer) {
    const container = question.element;
    const value = parseInt(answer);
    
    if (isNaN(value)) {
      console.warn('❌ Linear scale answer must be a number');
      return false;
    }
    
    // Cari radio buttons untuk scale
    const options = container.querySelectorAll('input[type="radio"]');
    
    for (const option of options) {
      if (parseInt(option.value) === value) {
        await this.selectRadioOption(option);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Mengisi text input (short answer, paragraph, etc)
   */
  async fillTextInput(question, answer) {
    const inputElement = question.inputElement;
    
    // Focus pada input
    await this.focusElement(inputElement);
    
    // Clear existing content
    await this.clearInput(inputElement);
    
    // Type the answer
    await this.typeText(inputElement, answer);
    
    // Trigger blur event
    inputElement.blur();
    
    return true;
  }

  /**
   * Mengisi date input
   */
  async fillDate(question, answer) {
    const inputElement = question.inputElement;
    const dateValue = this.parseDate(answer);
    
    if (!dateValue) {
      console.warn('❌ Invalid date format');
      return false;
    }
    
    await this.focusElement(inputElement);
    await this.clearInput(inputElement);
    
    inputElement.value = dateValue;
    await this.triggerEvent(inputElement, 'input');
    await this.triggerEvent(inputElement, 'change');
    
    return true;
  }

  /**
   * Mengisi time input
   */
  async fillTime(question, answer) {
    const inputElement = question.inputElement;
    const timeValue = this.parseTime(answer);
    
    if (!timeValue) {
      console.warn('❌ Invalid time format');
      return false;
    }
    
    await this.focusElement(inputElement);
    await this.clearInput(inputElement);
    
    inputElement.value = timeValue;
    await this.triggerEvent(inputElement, 'input');
    await this.triggerEvent(inputElement, 'change');
    
    return true;
  }

  /**
   * Helper: Get label text for an option
   */
  getOptionLabel(option) {
    // Try multiple approaches to get the label text
    let label = '';
    
    // 1. Check for associated label element
    const labelElement = option.closest('label') || 
                        document.querySelector(`label[for="${option.id}"]`) ||
                        option.parentElement.querySelector('label');
    
    if (labelElement) {
      label = labelElement.textContent?.trim();
    }
    
    // 2. Check parent element text
    if (!label && option.parentElement) {
      label = option.parentElement.textContent?.trim();
    }
    
    // 3. Check data attributes
    if (!label) {
      label = option.getAttribute('data-value') || 
              option.getAttribute('aria-label') || '';
    }
    
    // 4. Check next sibling text
    if (!label && option.nextElementSibling) {
      label = option.nextElementSibling.textContent?.trim();
    }
    
    return label || '';
  }

  /**
   * Helper: Check if option text matches answer
   */
  isAnswerMatch(optionText, answer) {
    if (!optionText || !answer) return false;
    
    const option = optionText.toLowerCase().trim();
    const ans = answer.toLowerCase().trim();
    
    return option === ans || 
           option.includes(ans) || 
           ans.includes(option);
  }

  /**
   * Helper: Check if text partially matches the answer
   */
  isPartialMatch(optionText, answer) {
    if (!optionText || !answer) return false;
    
    const option = optionText.toLowerCase().trim();
    const ans = answer.toLowerCase().trim();
    
    // More flexible matching
    const words1 = option.split(/\s+/);
    const words2 = ans.split(/\s+/);
    
    // Check if any words match
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.length > 2 && word2.length > 2 && 
            (word1.includes(word2) || word2.includes(word1))) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Helper: Parse date string to YYYY-MM-DD format
   */
  parseDate(dateStr) {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Helper: Parse time string to HH:MM format
   */
  parseTime(timeStr) {
    try {
      const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})?/);
      if (!timeMatch) return null;
      
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = (timeMatch[2] || '00').padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Helper: Focus on element
   */
  async focusElement(element) {
    element.focus();
    await this.delay(100);
  }

  /**
   * Helper: Clear input element
   */
  async clearInput(element) {
    element.value = '';
    element.textContent = '';
    
    // Select all and delete
    element.select();
    document.execCommand('selectAll');
    document.execCommand('delete');
    
    await this.triggerEvent(element, 'input');
  }

  /**
   * Helper: Type text with realistic timing
   */
  async typeText(element, text, speed = null) {
    speed = speed || this.typingSpeed;
    
    for (const char of text) {
      element.value += char;
      await this.triggerEvent(element, 'input');
      await this.delay(speed);
    }
    
    await this.triggerEvent(element, 'change');
  }

  /**
   * Helper: Trigger event on element
   */
  async triggerEvent(element, eventType, options = {}) {
    const event = new Event(eventType, { 
      bubbles: true, 
      cancelable: true,
      ...options 
    });
    element.dispatchEvent(event);
    await this.delay(50);
  }

  /**
   * Helper: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set filling speed
   */
  setFillSpeed(speed) {
    const speeds = {
      slow: { fillDelay: 1000, typingSpeed: 100 },
      normal: { fillDelay: 500, typingSpeed: 50 },
      fast: { fillDelay: 200, typingSpeed: 20 }
    };
    
    if (speeds[speed]) {
      this.fillDelay = speeds[speed].fillDelay;
      this.typingSpeed = speeds[speed].typingSpeed;
    }
  }
}
