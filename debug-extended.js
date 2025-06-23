/**
 * Extended Debug Tools untuk Autofy Form Filling
 * Tools khusus untuk debugging masalah form filling
 */

// Add to existing autofyDebug object
if (typeof window.autofyDebug === 'undefined') {
  window.autofyDebug = {};
}

// Debug tools for form analysis
window.autofyDebug.analyzeFormDetailed = function() {
  console.log('🔍 Detailed Form Analysis...');
  
  if (typeof FormAnalyzer === 'undefined') {
    console.error('❌ FormAnalyzer not available');
    return null;
  }
  
  const analyzer = new FormAnalyzer();
  
  // Test different selectors
  const selectors = [
    '[data-params*="question"]',
    '[role="listitem"][data-params]',
    '[jsmodel][data-params]',
    '.freebirdFormviewerComponentsQuestionBaseRoot',
    '.Qr7Oae',
    '[data-item-id]',
    '.geS5n',
    '.z12JJ'
  ];
  
  console.log('📊 Testing selectors:');
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  ${selector}: ${elements.length} elements`);
    
    if (elements.length > 0) {
      console.log(`    First element:`, elements[0]);
    }
  });
  
  // Analyze form
  const formData = analyzer.analyzeForm();
  console.log('📊 Form Analysis Result:', formData);
  
  if (formData && formData.questions) {
    formData.questions.forEach((question, index) => {
      console.log(`\n📝 Question ${index + 1}:`);
      console.log(`  Text: "${question.text}"`);
      console.log(`  Type: ${question.type}`);
      console.log(`  Required: ${question.required}`);
      console.log(`  Options: ${question.options.length > 0 ? question.options.join(', ') : 'None'}`);
      console.log(`  Has Input Element: ${!!question.inputElement}`);
      console.log(`  Input Element:`, question.inputElement);
      console.log(`  Answered: ${question.answered}`);
    });
  }
  
  return formData;
};

// Test form filling for specific question
window.autofyDebug.testFillQuestion = async function(questionIndex = 0, testAnswer = 'Test Answer') {
  console.log(`🧪 Testing form filling for question ${questionIndex + 1}...`);
  
  try {
    // Get form data
    const analyzer = new FormAnalyzer();
    const formData = analyzer.analyzeForm();
    
    if (!formData || !formData.questions || formData.questions.length === 0) {
      console.error('❌ No questions found');
      return false;
    }
    
    if (questionIndex >= formData.questions.length) {
      console.error(`❌ Question index ${questionIndex} out of range (max: ${formData.questions.length - 1})`);
      return false;
    }
    
    const question = formData.questions[questionIndex];
    console.log('📝 Testing question:', question.text.substring(0, 100));
    console.log('📝 Question type:', question.type);
    console.log('📝 Input element:', question.inputElement);
    
    if (!question.inputElement) {
      console.error('❌ No input element found for this question');
      return false;
    }
    
    // Test filling
    const filler = new FormFiller();
    const result = await filler.fillQuestion(question, testAnswer);
    
    console.log('📝 Fill result:', result);
    
    // Verify
    setTimeout(() => {
      const verifyResult = analyzer.isQuestionAnswered(question.element, question.type);
      console.log('✅ Verification - Question answered:', verifyResult);
    }, 1000);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing question filling:', error);
    return false;
  }
};

// Generate and fill all questions with test data
window.autofyDebug.testFillAllQuestions = async function() {
  console.log('🧪 Testing fill all questions...');
  
  try {
    const analyzer = new FormAnalyzer();
    const filler = new FormFiller();
    const formData = analyzer.analyzeForm();
    
    if (!formData || !formData.questions.length) {
      console.error('❌ No questions found');
      return false;
    }
    
    const results = [];
    
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      console.log(`\n📝 Testing question ${i + 1}: ${question.text.substring(0, 50)}...`);
      
      let testAnswer = '';
      
      // Generate appropriate test answer based on question type
      switch (question.type) {
        case 'multiple_choice':
          if (question.options.length > 0) {
            testAnswer = question.options[0]; // Pick first option
          }
          break;
        case 'checkbox':
          if (question.options.length > 0) {
            testAnswer = [question.options[0]]; // Pick first option as array
          }
          break;
        case 'dropdown':
          if (question.options.length > 0) {
            testAnswer = question.options[0]; // Pick first option
          }
          break;
        case 'linear_scale':
          testAnswer = '3'; // Middle value
          break;
        case 'short_answer':
          testAnswer = 'Test answer';
          break;
        case 'paragraph':
          testAnswer = 'This is a test paragraph answer for automated form filling.';
          break;
        case 'email':
          testAnswer = 'test@example.com';
          break;
        case 'url':
          testAnswer = 'https://example.com';
          break;
        case 'number':
          testAnswer = '42';
          break;
        case 'date':
          testAnswer = '2024-01-01';
          break;
        case 'time':
          testAnswer = '12:00';
          break;
        default:
          testAnswer = 'Test answer';
      }
      
      if (testAnswer) {
        const result = await filler.fillQuestion(question, testAnswer);
        results.push({ question: i + 1, success: result, type: question.type });
        console.log(`${result ? '✅' : '❌'} Question ${i + 1} result: ${result}`);
        
        // Small delay between questions
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`⚠️ Skipping question ${i + 1} - no test answer generated`);
        results.push({ question: i + 1, success: false, type: question.type, reason: 'No test answer' });
      }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`\n📊 Test Results Summary:`);
    console.log(`✅ Successful: ${successful}/${total}`);
    console.log(`❌ Failed: ${total - successful}/${total}`);
    
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const reason = result.reason ? ` (${result.reason})` : '';
      console.log(`${status} Question ${result.question} (${result.type})${reason}`);
    });
    
    return { successful, total, results };
    
  } catch (error) {
    console.error('❌ Error testing all questions:', error);
    return false;
  }
};

// Find all form elements on page
window.autofyDebug.findAllFormElements = function() {
  console.log('🔍 Finding all form elements...');
  
  const selectors = {
    'Text Inputs': 'input[type="text"], input[type="email"], input[type="url"], input[type="number"]',
    'Textareas': 'textarea',
    'Radio Buttons': 'input[type="radio"]',
    'Checkboxes': 'input[type="checkbox"]',
    'Select Dropdowns': 'select',
    'Date Inputs': 'input[type="date"]',
    'Time Inputs': 'input[type="time"]',
    'File Inputs': 'input[type="file"]',
    'Google Form Inputs': '.quantumWizTextinputPaperinputInput',
    'Role Textboxes': '[role="textbox"]',
    'Role Radio': '[role="radio"]',
    'Role Checkbox': '[role="checkbox"]',
    'Role Listbox': '[role="listbox"]',
    'Data Value Elements': '[data-value]',
    'Question Containers': '[data-params*="question"]'
  };
  
  Object.entries(selectors).forEach(([name, selector]) => {
    const elements = document.querySelectorAll(selector);
    console.log(`${name}: ${elements.length} elements`);
    
    if (elements.length > 0 && elements.length <= 5) {
      elements.forEach((el, i) => console.log(`  ${i + 1}:`, el));
    } else if (elements.length > 5) {
      console.log('  First 3:', Array.from(elements).slice(0, 3));
    }
  });
};

// Quick test command
window.autofyDebug.quickTest = async function() {
  console.log('🚀 Running Quick Autofy Test...\n');
  
  // 1. Test components
  console.log('1️⃣ Testing Components...');
  const components = window.autofyDebug.testComponentsLoaded();
  
  // 2. Test form analysis
  console.log('\n2️⃣ Testing Form Analysis...');
  const formData = window.autofyDebug.analyzeFormDetailed();
  
  // 3. Test first question if available
  if (formData && formData.questions && formData.questions.length > 0) {
    console.log('\n3️⃣ Testing First Question Fill...');
    await window.autofyDebug.testFillQuestion(0);
  }
  
  // 4. Summary
  console.log('\n📋 Quick Test Summary:');
  console.log(`Components Loaded: ${components ? '✅' : '❌'}`);
  console.log(`Form Analysis: ${formData ? '✅' : '❌'}`);
  console.log(`Questions Found: ${formData ? formData.questions.length : 0}`);
  
  return {
    components,
    formData,
    questionsCount: formData ? formData.questions.length : 0
  };
};

console.log('🔧 Extended Autofy Debug Tools loaded!');
console.log('Available commands:');
console.log('  window.autofyDebug.quickTest() - Run quick diagnostic');
console.log('  window.autofyDebug.analyzeFormDetailed() - Detailed form analysis');
console.log('  window.autofyDebug.testFillQuestion(index) - Test single question');
console.log('  window.autofyDebug.testFillAllQuestions() - Test all questions');
console.log('  window.autofyDebug.findAllFormElements() - Find all form elements');
