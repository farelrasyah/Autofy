/**
 * Quick Diagnostic untuk Autofy Extension
 * Jalankan ini di console untuk diagnosa masalah "Menguji koneksi..."
 */

console.log('🔧 Autofy Quick Diagnostic Tool');
console.log('================================\n');

// Test 1: Check API Key dari .env
function checkApiKey() {
  console.log('🔑 1. Checking API Key...');
  
  const apiKey = 'AIzaSyARIKwnlrUeIxpGvTS5VhRxuR2HhWQCxoY';
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('❌ API key not set in .env file');
    return false;
  }
  
  if (!apiKey.startsWith('AIza')) {
    console.error('❌ Invalid API key format (should start with AIza)');
    return false;
  }
  
  if (apiKey.length < 30) {
    console.error('❌ API key seems too short');
    return false;
  }
  
  console.log('✅ API key format looks valid');
  console.log('   Key preview:', apiKey.substring(0, 10) + '...');
  return true;
}

// Test 2: Network connectivity
async function checkNetworkConnectivity() {
  console.log('\n🌐 2. Checking Network Connectivity...');
  
  try {
    // Test basic internet
    const googleResponse = await fetch('https://www.google.com/', { 
      method: 'HEAD',
      mode: 'no-cors' 
    });
    console.log('✅ Internet connectivity: OK');
    
    // Test Google AI domain
    const aiResponse = await fetch('https://generativelanguage.googleapis.com/', { 
      method: 'HEAD',
      mode: 'no-cors' 
    });
    console.log('✅ Google AI domain accessible: OK');
    
    return true;
  } catch (error) {
    console.error('❌ Network connectivity issue:', error.message);
    return false;
  }
}

// Test 3: Direct API call
async function testDirectApiCall() {
  console.log('\n🧪 3. Testing Direct API Call...');
  
  const apiKey = 'AIzaSyARIKwnlrUeIxpGvTS5VhRxuR2HhWQCxoY';
  
  try {
    console.log('📡 Making API request...');
    
    const startTime = Date.now();
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Respond with just "TEST OK"'
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        })
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Request took: ${duration}ms`);
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      // Common error analysis
      if (response.status === 403) {
        console.error('🚨 Error 403: API key invalid or quota exceeded');
        console.log('💡 Solutions:');
        console.log('   - Check API key at https://makersuite.google.com/app/apikey');
        console.log('   - Verify quota limits');
        console.log('   - Generate new API key if needed');
      } else if (response.status === 429) {
        console.error('🚨 Error 429: Too many requests');
        console.log('💡 Solution: Wait a few minutes and try again');
      } else if (response.status === 400) {
        console.error('🚨 Error 400: Bad request format');
      }
      
      return false;
    }
    
    const data = await response.json();
    console.log('✅ API call successful!');
    
    if (data.candidates && data.candidates[0]) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini Response:', responseText);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API call failed:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network error - possibly blocked by firewall or proxy');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Request timeout - slow connection or server issues');
    }
    
    return false;
  }
}

// Test 4: Chrome extension context
function checkExtensionContext() {
  console.log('\n🔌 4. Checking Chrome Extension Context...');
  
  if (typeof chrome === 'undefined') {
    console.error('❌ Chrome extension APIs not available');
    console.log('💡 Make sure you\'re running this in extension context');
    return false;
  }
  
  if (typeof chrome.runtime === 'undefined') {
    console.error('❌ Chrome runtime API not available');
    return false;
  }
  
  if (typeof chrome.storage === 'undefined') {
    console.error('❌ Chrome storage API not available');
    return false;
  }
  
  console.log('✅ Chrome extension APIs available');
  return true;
}

// Test 5: Extension permissions
function checkPermissions() {
  console.log('\n🔐 5. Checking Extension Permissions...');
  
  // Check if we can access the required APIs
  chrome.permissions.getAll((permissions) => {
    console.log('📋 Granted permissions:', permissions.permissions);
    console.log('🌐 Host permissions:', permissions.origins);
    
    const requiredPermissions = ['activeTab', 'storage', 'scripting'];
    const requiredHosts = ['https://docs.google.com/*', 'https://generativelanguage.googleapis.com/*'];
    
    const missingPermissions = requiredPermissions.filter(p => !permissions.permissions.includes(p));
    const missingHosts = requiredHosts.filter(h => !permissions.origins?.some(origin => origin.includes(h.replace('*', ''))));
    
    if (missingPermissions.length > 0) {
      console.error('❌ Missing permissions:', missingPermissions);
    } else {
      console.log('✅ All required permissions granted');
    }
    
    if (missingHosts.length > 0) {
      console.error('❌ Missing host permissions:', missingHosts);
    } else {
      console.log('✅ All required host permissions granted');
    }
  });
}

// Run all diagnostics
async function runFullDiagnostic() {
  console.log('🚀 Running Full Diagnostic...\n');
  
  const results = {
    apiKey: checkApiKey(),
    network: await checkNetworkConnectivity(),
    apiCall: await testDirectApiCall(),
    extension: checkExtensionContext()
  };
  
  checkPermissions();
  
  console.log('\n📊 DIAGNOSTIC RESULTS');
  console.log('=====================');
  console.log('API Key:', results.apiKey ? '✅' : '❌');
  console.log('Network:', results.network ? '✅' : '❌');
  console.log('API Call:', results.apiCall ? '✅' : '❌');
  console.log('Extension Context:', results.extension ? '✅' : '❌');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Extension should work correctly.');
    console.log('💡 If still having issues, try:');
    console.log('   - Reload the extension');
    console.log('   - Clear browser cache');
    console.log('   - Restart Chrome');
  } else {
    console.log('\n🔧 Issues found. Fix the failed tests above.');
  }
  
  return results;
}

// Quick fixes
console.log('\n🛠️ QUICK FIXES for "Menguji koneksi..." issue:');
console.log('================================================');
console.log('1. Wait 15-30 seconds for timeout');
console.log('2. Check your internet connection');
console.log('3. Verify API key at: https://makersuite.google.com/app/apikey');
console.log('4. Try reloading the extension');
console.log('5. Check browser console for errors');
console.log('\n▶️ Run runFullDiagnostic() to start testing');

// Export function to global scope
window.runFullDiagnostic = runFullDiagnostic;
window.testDirectApiCall = testDirectApiCall;
window.checkApiKey = checkApiKey;
