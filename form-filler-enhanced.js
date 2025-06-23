/**
 * Enhanced Form Filler untuk Autofy Extension
 * Mengisi jawaban ke dalam Google Form secara otomatis dengan robust selection
 */
class FormFillerEnhanced {
  constructor() {
    this.fillDelay = 500; // Delay antar pengisian (ms)
    this.typingSpeed = 50; // Kecepatan mengetik (ms per karakter)
    this.maxRetries = 3; // Maximum retry attempts
  }

  /**
   * Mengisi jawaban untuk satu pertanyaan
   */
  async fillQuestion(question, answer) {
    console.log('📝 FormFillerEnhanced.fillQuestion called with:', {
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
      
      // Use retry mechanism for better reliability
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${this.maxRetries} for ${question.type}`);
        
        let success = false;
        switch (question.type) {
          case 'multiple_choice':
            success = await this.fillMultipleChoice(question, answer);
            break;
          
          case 'checkbox':
            success = await this.fillCheckbox(question, answer);
            break;
          
          case 'dropdown':
            success = await this.fillDropdown(question, answer);
            break;
          
          case 'text':
          case 'paragraph_text':
          case 'short_answer':
          case 'long_answer':
            success = await this.fillTextInput(question, answer);
            break;
          
          case 'scale':
          case 'linear_scale':
            success = await this.fillScale(question, answer);
            break;
          
          case 'grid':
            success = await this.fillGrid(question, answer);
            break;
          
          default:
            console.warn(`❓ Unknown question type: ${question.type}, trying generic fill`);
            success = await this.fillGeneric(question, answer);
        }
        
        if (success) {
          console.log(`✅ Successfully filled ${question.type} on attempt ${attempt}`);
          return true;
        }
        
        if (attempt < this.maxRetries) {
          console.log(`⚠️ Attempt ${attempt} failed, retrying...`);
          await this.delay(1000); // Wait before retry
        }
      }
      
      console.error(`❌ Failed to fill ${question.type} after ${this.maxRetries} attempts`);
      return false;
      
    } catch (error) {
      console.error('❌ Error filling question:', error);
      return false;
    }
  }

  /**
   * Enhanced multiple choice filling with comprehensive selection methods
   */
  async fillMultipleChoice(question, answer) {
    console.log('🔘 fillMultipleChoice called');
    const container = question.element;
    
    // Multiple selector strategies for different Google Form layouts
    const radioSelectors = [
      'input[type="radio"]',
      '[role="radio"]',
      '[role="radiogroup"] [role="radio"]',
      '.freebirdFormviewerComponentsQuestionRadioChoice input[type="radio"]',
      '.freebirdFormviewerComponentsQuestionRadioChoice [role="radio"]',
      '.quantumWizTogglePaperradioEl input[type="radio"]',
      '.quantumWizTogglePaperradioEl [role="radio"]',
      '.docssharedWizToggleLabeledLabelWrapper input[type="radio"]'
    ];
    
    let options = [];
    let successfulSelector = '';
    
    // Find radio options using different selectors
    for (const selector of radioSelectors) {
      options = container.querySelectorAll(selector);
      if (options.length > 0) {
        successfulSelector = selector;
        console.log(`✅ Found ${options.length} radio options with selector: ${selector}`);
        break;
      }
    }
    
    if (options.length === 0) {
      console.warn('❌ No radio options found with standard selectors, trying clickable elements...');
      return await this.fillMultipleChoiceByClickableElements(container, answer);
    }
    
    // Try exact match first
    for (const option of options) {
      const label = this.getOptionLabel(option);
      console.log(`🔍 Checking option: "${label}"`);
      
      if (this.isAnswerMatch(label, answer)) {
        console.log(`✅ Exact match found: "${label}"`);
        const success = await this.selectRadioOptionEnhanced(option, container);
        if (success) {
          await this.verifySelection(option, label);
          return true;
        }
      }
    }
    
    // Try partial match if no exact match
    for (const option of options) {
      const label = this.getOptionLabel(option);
      if (this.isPartialMatch(label, answer)) {
        console.log(`🎯 Partial match found: "${label}"`);
        const success = await this.selectRadioOptionEnhanced(option, container);
        if (success) {
          await this.verifySelection(option, label);
          return true;
        }
      }
    }
    
    // If no match found, select first option as fallback
    if (options.length > 0) {
      console.log(`🔄 No match found, selecting first option as fallback`);
      const firstOption = options[0];
      const label = this.getOptionLabel(firstOption);
      const success = await this.selectRadioOptionEnhanced(firstOption, container);
      if (success) {
        await this.verifySelection(firstOption, label);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Alternative method to fill multiple choice by finding clickable elements
   */
  async fillMultipleChoiceByClickableElements(container, answer) {
    console.log('🔄 Trying clickable elements approach...');
    
    // Find all clickable elements that might be radio options
    const clickableSelectors = [
      '.freebirdFormviewerComponentsQuestionRadioChoice',
      '.quantumWizTogglePaperradioEl',
      '.docssharedWizToggleLabeledLabelWrapper',
      '[role="radio"]',
      'label[for*="radio"]',
      'div[jsaction*="click"]'
    ];
    
    for (const selector of clickableSelectors) {
      const elements = container.querySelectorAll(selector);
      if (elements.length === 0) continue;
      
      console.log(`🔍 Found ${elements.length} clickable elements with selector: ${selector}`);
      
      for (const element of elements) {
        const text = this.extractElementText(element);
        console.log(`🔍 Checking clickable element: "${text}"`);
        
        if (this.isAnswerMatch(text, answer) || this.isPartialMatch(text, answer)) {
          console.log(`✅ Match found in clickable element: "${text}"`);
          const success = await this.clickElementEnhanced(element);
          if (success) {
            await this.delay(500);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Enhanced radio option selection with multiple strategies
   */
  async selectRadioOptionEnhanced(option, container) {
    console.log('🎯 selectRadioOptionEnhanced called');
    
    try {
      // Strategy 1: Standard radio selection
      const success1 = await this.selectRadioStandard(option);
      if (success1 && this.isOptionSelected(option)) {
        console.log('✅ Standard radio selection successful');
        return true;
      }
      
      // Strategy 2: Click parent container
      const success2 = await this.selectRadioByContainer(option);
      if (success2 && this.isOptionSelected(option)) {
        console.log('✅ Container click selection successful');
        return true;
      }
      
      // Strategy 3: Find and click associated label
      const success3 = await this.selectRadioByLabel(option);
      if (success3 && this.isOptionSelected(option)) {
        console.log('✅ Label click selection successful');
        return true;
      }
      
      // Strategy 4: Simulate user interaction
      const success4 = await this.selectRadioBySimulation(option);
      if (success4 && this.isOptionSelected(option)) {
        console.log('✅ Simulation selection successful');
        return true;
      }
      
      console.warn('⚠️ All selection strategies failed');
      return false;
      
    } catch (error) {
      console.error('❌ Error in selectRadioOptionEnhanced:', error);
      return false;
    }
  }

  /**
   * Standard radio button selection
   */
  async selectRadioStandard(option) {
    try {
      // Focus first
      option.focus();
      await this.delay(100);
      
      // Set checked property
      if (option.type === 'radio') {
        option.checked = true;
      }
      
      // Set aria-checked for accessibility
      if (option.hasAttribute('aria-checked')) {
        option.setAttribute('aria-checked', 'true');
      }
      
      // Trigger events
      const events = ['focus', 'mousedown', 'mouseup', 'click', 'change', 'input'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        option.dispatchEvent(event);
        await this.delay(50);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in selectRadioStandard:', error);
      return false;
    }
  }

  /**
   * Select radio by clicking parent container
   */
  async selectRadioByContainer(option) {
    try {
      const containers = [
        option.closest('.freebirdFormviewerComponentsQuestionRadioChoice'),
        option.closest('.quantumWizTogglePaperradioEl'),
        option.closest('.docssharedWizToggleLabeledLabelWrapper'),
        option.closest('label'),
        option.closest('[role="radio"]')
      ];
      
      for (const container of containers) {
        if (container && container !== option) {
          console.log('🔗 Clicking parent container');
          await this.clickElementEnhanced(container);
          await this.delay(200);
          
          if (this.isOptionSelected(option)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error in selectRadioByContainer:', error);
      return false;
    }
  }

  /**
   * Select radio by clicking associated label
   */
  async selectRadioByLabel(option) {
    try {
      const labels = [
        option.labels?.[0],
        document.querySelector(`label[for="${option.id}"]`),
        option.parentElement?.querySelector('label'),
        option.nextElementSibling?.tagName === 'LABEL' ? option.nextElementSibling : null
      ].filter(Boolean);
      
      for (const label of labels) {
        console.log('🔗 Clicking associated label');
        await this.clickElementEnhanced(label);
        await this.delay(200);
        
        if (this.isOptionSelected(option)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error in selectRadioByLabel:', error);
      return false;
    }
  }

  /**
   * Select radio by simulating user interaction
   */
  async selectRadioBySimulation(option) {
    try {
      // Get element position
      const rect = option.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      // Create more realistic mouse events
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      });
      
      const mouseUp = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      });
      
      const click = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      });
      
      // Simulate user interaction sequence
      option.dispatchEvent(mouseDown);
      await this.delay(50);
      option.dispatchEvent(mouseUp);
      await this.delay(50);
      option.dispatchEvent(click);
      await this.delay(100);
      
      // Trigger change events
      const change = new Event('change', { bubbles: true });
      const input = new Event('input', { bubbles: true });
      option.dispatchEvent(change);
      option.dispatchEvent(input);
      
      return true;
    } catch (error) {
      console.error('❌ Error in selectRadioBySimulation:', error);
      return false;
    }
  }

  /**
   * Enhanced element clicking with multiple strategies
   */
  async clickElementEnhanced(element) {
    try {
      // Strategy 1: Standard click
      element.click();
      await this.delay(100);
      
      // Strategy 2: Dispatch click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(clickEvent);
      await this.delay(100);
      
      // Strategy 3: Focus and trigger keydown (Enter/Space)
      element.focus();
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true
      });
      element.dispatchEvent(enterEvent);
      await this.delay(100);
      
      return true;
    } catch (error) {
      console.error('❌ Error in clickElementEnhanced:', error);
      return false;
    }
  }

  /**
   * Check if radio option is selected
   */
  isOptionSelected(option) {
    return option.checked || 
           option.getAttribute('aria-checked') === 'true' ||
           option.classList.contains('isChecked') ||
           option.classList.contains('selected') ||
           option.parentElement?.classList.contains('isChecked');
  }

  /**
   * Verify selection and log result
   */
  async verifySelection(option, label) {
    await this.delay(200); // Wait for UI to update
    
    const isSelected = this.isOptionSelected(option);
    if (isSelected) {
      console.log(`✅ Verified: Option "${label}" is selected`);
    } else {
      console.warn(`⚠️ Verification failed: Option "${label}" appears not selected`);
    }
    
    return isSelected;
  }

  /**
   * Extract text content from element with better cleaning
   */
  extractElementText(element) {
    let text = '';
    
    // Try different text extraction methods
    if (element.textContent) {
      text = element.textContent;
    } else if (element.innerText) {
      text = element.innerText;
    } else if (element.value) {
      text = element.value;
    } else if (element.getAttribute('aria-label')) {
      text = element.getAttribute('aria-label');
    } else if (element.title) {
      text = element.title;
    }
    
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Get label text for radio option
   */
  getOptionLabel(option) {
    // Try multiple methods to get the label
    const methods = [
      () => option.nextElementSibling?.textContent?.trim(),
      () => option.parentElement?.textContent?.trim(),
      () => option.closest('label')?.textContent?.trim(),
      () => option.labels?.[0]?.textContent?.trim(),
      () => document.querySelector(`label[for="${option.id}"]`)?.textContent?.trim(),
      () => option.getAttribute('aria-label')?.trim(),
      () => option.value?.trim(),
      () => option.title?.trim()
    ];
    
    for (const method of methods) {
      try {
        const text = method();
        if (text && text.length > 0) {
          return text.replace(/\s+/g, ' ');
        }
      } catch (e) {
        // Continue to next method
      }
    }
    
    return '';
  }

  /**
   * Enhanced dropdown filling
   */
  async fillDropdown(question, answer) {
    console.log('📋 fillDropdown called');
    const container = question.element;
    
    // Find dropdown select element
    let select = container.querySelector('select');
    
    if (select) {
      return await this.fillSelectDropdown(select, answer);
    }
    
    // Try custom dropdown (Google Forms style)
    return await this.fillCustomDropdown(container, answer);
  }

  /**
   * Fill standard HTML select dropdown
   */
  async fillSelectDropdown(select, answer) {
    try {
      select.focus();
      await this.delay(100);
      
      const options = select.querySelectorAll('option');
      
      // Try exact match first
      for (const option of options) {
        if (this.isAnswerMatch(option.textContent.trim(), answer)) {
          select.value = option.value;
          option.selected = true;
          
          // Trigger events
          const events = ['change', 'input'];
          for (const eventType of events) {
            const event = new Event(eventType, { bubbles: true });
            select.dispatchEvent(event);
          }
          
          console.log(`✅ Selected dropdown option: "${option.textContent.trim()}"`);
          return true;
        }
      }
      
      // Try partial match
      for (const option of options) {
        if (this.isPartialMatch(option.textContent.trim(), answer)) {
          select.value = option.value;
          option.selected = true;
          
          const events = ['change', 'input'];
          for (const eventType of events) {
            const event = new Event(eventType, { bubbles: true });
            select.dispatchEvent(event);
          }
          
          console.log(`✅ Selected dropdown option (partial): "${option.textContent.trim()}"`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error filling select dropdown:', error);
      return false;
    }
  }

  /**
   * Fill custom dropdown (Google Forms style)
   */
  async fillCustomDropdown(container, answer) {
    // Look for dropdown trigger
    const dropdownTriggers = [
      '.quantumWizMenuPaperselectEl',
      '.freebirdFormviewerComponentsQuestionSelectRoot',
      '[role="listbox"]',
      '[role="combobox"]',
      '.dropdown-trigger'
    ];
    
    let trigger = null;
    for (const selector of dropdownTriggers) {
      trigger = container.querySelector(selector);
      if (trigger) break;
    }
    
    if (!trigger) {
      console.warn('❌ No dropdown trigger found');
      return false;
    }
    
    // Click to open dropdown
    await this.clickElementEnhanced(trigger);
    await this.delay(500);
    
    // Find dropdown options
    const optionSelectors = [
      '[role="option"]',
      '.quantumWizMenuPaperselectOption',
      '.dropdown-option',
      'li[data-value]'
    ];
    
    let options = [];
    for (const selector of optionSelectors) {
      options = document.querySelectorAll(selector);
      if (options.length > 0) break;
    }
    
    if (options.length === 0) {
      console.warn('❌ No dropdown options found after opening');
      return false;
    }
    
    // Try to select matching option
    for (const option of options) {
      const text = this.extractElementText(option);
      if (this.isAnswerMatch(text, answer) || this.isPartialMatch(text, answer)) {
        await this.clickElementEnhanced(option);
        await this.delay(300);
        console.log(`✅ Selected custom dropdown option: "${text}"`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Fill text input fields
   */
  async fillTextInput(question, answer) {
    console.log('📝 fillTextInput called');
    const input = question.inputElement;
    
    try {
      // Focus on input
      input.focus();
      await this.delay(100);
      
      // Clear existing content
      input.value = '';
      input.select();
      
      // Simulate typing
      for (const char of answer) {
        input.value += char;
        
        // Trigger input event for each character
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        
        await this.delay(this.typingSpeed);
      }
      
      // Trigger final events
      const events = ['change', 'blur'];
      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true });
        input.dispatchEvent(event);
      }
      
      console.log(`✅ Filled text input with: "${answer}"`);
      return true;
      
    } catch (error) {
      console.error('❌ Error filling text input:', error);
      return false;
    }
  }

  /**
   * Fill checkbox questions
   */
  async fillCheckbox(question, answer) {
    console.log('☑️ fillCheckbox called');
    const container = question.element;
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    if (checkboxes.length === 0) {
      console.warn('❌ No checkboxes found');
      return false;
    }
    
    // Handle multiple answers
    const answers = Array.isArray(answer) ? answer : [answer];
    let filled = false;
    
    for (const ans of answers) {
      for (const checkbox of checkboxes) {
        const label = this.getOptionLabel(checkbox);
        if (this.isAnswerMatch(label, ans) || this.isPartialMatch(label, ans)) {
          if (!checkbox.checked) {
            await this.selectRadioOptionEnhanced(checkbox, container);
            filled = true;
          }
        }
      }
    }
    
    return filled;
  }

  /**
   * Fill scale/linear scale questions
   */
  async fillScale(question, answer) {
    console.log('📊 fillScale called');
    const container = question.element;
    
    // Parse numeric answer
    const numericAnswer = parseInt(answer);
    if (isNaN(numericAnswer)) {
      console.warn('❌ Scale answer is not numeric');
      return false;
    }
    
    // Find scale options
    const scaleOptions = container.querySelectorAll('input[type="radio"], [role="radio"]');
    
    for (const option of scaleOptions) {
      const value = parseInt(option.value || option.getAttribute('data-value') || '');
      if (value === numericAnswer) {
        return await this.selectRadioOptionEnhanced(option, container);
      }
    }
    
    return false;
  }

  /**
   * Fill grid questions
   */
  async fillGrid(question, answer) {
    console.log('📋 fillGrid called');
    // Grid questions are complex and require specific handling
    // This is a placeholder for now
    console.warn('⚠️ Grid question filling not yet implemented');
    return false;
  }

  /**
   * Generic fill method for unknown question types
   */
  async fillGeneric(question, answer) {
    console.log('❓ fillGeneric called');
    const input = question.inputElement;
    
    if (input.type === 'text' || input.tagName === 'TEXTAREA') {
      return await this.fillTextInput(question, answer);
    }
    
    if (input.type === 'radio') {
      return await this.fillMultipleChoice(question, answer);
    }
    
    if (input.type === 'checkbox') {
      return await this.fillCheckbox(question, answer);
    }
    
    console.warn('❓ Unknown input type for generic fill');
    return false;
  }

  /**
   * Check if answer matches option (exact match)
   */
  isAnswerMatch(optionText, answer) {
    if (!optionText || !answer) return false;
    
    const option = optionText.toLowerCase().trim();
    const ans = answer.toLowerCase().trim();
    
    return option === ans;
  }

  /**
   * Check if answer partially matches option
   */
  isPartialMatch(optionText, answer) {
    if (!optionText || !answer) return false;
    
    const option = optionText.toLowerCase().trim();
    const ans = answer.toLowerCase().trim();
    
    return option.includes(ans) || ans.includes(option);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the enhanced form filler
window.formFillerEnhanced = window.formFillerEnhanced || new FormFillerEnhanced();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormFillerEnhanced;
}
