/**
 * Quick Test Script for Autofy Extension Debugging
 * Run this in browser console to test extension components
 */

// Test if all components are loaded
function testComponentsLoaded() {
  console.log('🧪 Testing Autofy Components...');
  
  const tests = [
    { name: 'ConfigManager', obj: typeof ConfigManager !== 'undefined' },
    { name: 'ApiKeyProtection', obj: typeof ApiKeyProtection !== 'undefined' },
    { name: 'GeminiService', obj: typeof GeminiService !== 'undefined' },
    { name: 'FormAnalyzer', obj: typeof FormAnalyzer !== 'undefined' },
    { name: 'FormFiller', obj: typeof FormFiller !== 'undefined' }
  ];
  
  tests.forEach(test => {
    const status = test.obj ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.obj ? 'Loaded' : 'Not Found'}`);
  });
  
  return tests.every(test => test.obj);
}

// Test API key initialization
async function testApiKey() {
  console.log('🔑 Testing API Key...');
  
  try {
    if (typeof ApiKeyProtection === 'undefined') {
      console.error('❌ ApiKeyProtection not available');
      return false;
    }
    
    const apiProtection = new ApiKeyProtection();
    const apiKey = apiProtection.getApiKey();
    
    console.log('🔑 API Key length:', apiKey ? apiKey.length : 'null');
    console.log('🔑 API Key starts with AIza:', apiKey ? apiKey.startsWith('AIza') : false);
    
    return apiKey && apiKey.startsWith('AIza') && apiKey.length > 30;
  } catch (error) {
    console.error('❌ Error testing API key:', error);
    return false;
  }
}

// Test Gemini service
async function testGeminiService() {
  console.log('🤖 Testing Gemini Service...');
  
  try {
    if (typeof ApiKeyProtection === 'undefined' || typeof GeminiService === 'undefined') {
      console.error('❌ Required classes not available');
      return false;
    }
    
    const apiProtection = new ApiKeyProtection();
    const apiKey = apiProtection.getApiKey();
    
    if (!apiKey) {
      console.error('❌ No API key available');
      return false;
    }
    
    const geminiService = new GeminiService(apiKey);
    const testResult = await geminiService.testConnection();
    
    console.log('🤖 Test result:', testResult);
    return testResult.success;
  } catch (error) {
    console.error('❌ Error testing Gemini service:', error);
    return false;
  }
}

// Test form analysis
function testFormAnalysis() {
  console.log('📊 Testing Form Analysis...');
  
  try {
    if (typeof FormAnalyzer === 'undefined') {
      console.error('❌ FormAnalyzer not available');
      return false;
    }
    
    const formAnalyzer = new FormAnalyzer();
    const formData = formAnalyzer.analyzeForm();
    
    console.log('📊 Form data:', formData);
    console.log('📊 Questions found:', formData ? formData.questions.length : 0);
    
    return formData && formData.questions && formData.questions.length > 0;
  } catch (error) {
    console.error('❌ Error testing form analysis:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running Autofy Debug Tests...\n');
  
  const results = {
    components: testComponentsLoaded(),
    apiKey: await testApiKey(),
    geminiService: await testGeminiService(),
    formAnalysis: testFormAnalysis()
  };
  
  console.log('\n📋 Test Results Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n💡 Troubleshooting Tips:');
    if (!results.components) console.log('- Refresh the page to reload extension scripts');
    if (!results.apiKey) console.log('- Check API key configuration in api-protection.js');
    if (!results.geminiService) console.log('- Check internet connection and API key validity');
    if (!results.formAnalysis) console.log('- Make sure you\'re on a Google Form page (viewform)');
  }
  
  return results;
}

// Test individual question filling
async function testQuestionFilling() {
  console.log('📝 Testing Question Filling...');
  
  try {
    const formAnalyzer = new FormAnalyzer();
    const formData = formAnalyzer.analyzeForm();
    
    if (!formData || !formData.questions.length) {
      console.error('❌ No questions found to test');
      return false;
    }
    
    const firstQuestion = formData.questions[0];
    console.log('📝 Testing with first question:', firstQuestion.text.substring(0, 50));
    
    const apiProtection = new ApiKeyProtection();
    const apiKey = apiProtection.getApiKey();
    const geminiService = new GeminiService(apiKey);
    const formFiller = new FormFiller();
    
    // Generate answer
    const answer = await geminiService.generateAnswer(firstQuestion.text, {
      questionType: firstQuestion.type,
      options: firstQuestion.options,
      language: 'id',
      responseStyle: 'natural'
    });
    
    console.log('📝 Generated answer:', answer);
    
    // Fill answer
    const filled = await formFiller.fillQuestion(firstQuestion, answer);
    console.log('📝 Fill result:', filled);
    
    return filled;
  } catch (error) {
    console.error('❌ Error testing question filling:', error);
    return false;
  }
}

// Export functions for manual testing
window.autofyDebug = {
  testComponentsLoaded,
  testApiKey,
  testGeminiService,
  testFormAnalysis,
  testQuestionFilling,
  runAllTests
};

console.log('🔧 Autofy Debug Tools loaded. Use window.autofyDebug.runAllTests() to run all tests.');
