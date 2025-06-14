/**
 * API Key Validator untuk Autofy Extension
 * Script untuk test manual API key sebelum digunakan di extension
 */

// Test API key secara manual
async function testGeminiApiKey() {
  const API_KEY = 'AIzaSyARIKwnlrUeIxpGvTS5VhRxuR2HhWQCxoY';
  
  console.log('🔑 Testing Gemini API Key...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection - respond with "OK"'
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        })
      }
    );
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.error('❌ Parsed Error:', errorData);
        
        if (errorData.error?.code === 400) {
          console.error('🚨 Bad Request - Check API key format');
        } else if (errorData.error?.code === 403) {
          console.error('🚨 Forbidden - API key invalid or quota exceeded');
        } else if (errorData.error?.code === 429) {
          console.error('🚨 Rate Limited - Too many requests');
        }
      } catch (e) {
        console.error('❌ Raw Error Response:', errorText);
      }
      
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Success! Response:', data);
    
    if (data.candidates && data.candidates[0]) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log('🤖 Gemini Response:', responseText);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Network/Connection Error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network connectivity issue or CORS blocking');
    }
    
    return false;
  }
}

// Test API dengan different endpoints
async function testApiEndpoints() {
  const API_KEY = 'AIzaSyARIKwnlrUeIxpGvTS5VhRxuR2HhWQCxoY';
  
  console.log('\n🔬 Testing different API endpoints...');
  
  // Test 1: List models endpoint
  try {
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    console.log('📋 Models endpoint status:', modelsResponse.status);
    
    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      console.log('✅ Available models:', models.models?.length || 0);
    }
  } catch (error) {
    console.error('❌ Models endpoint error:', error.message);
  }
  
  // Test 2: Simple generation
  try {
    const simpleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      }
    );
    
    console.log('💬 Simple generation status:', simpleResponse.status);
    
    if (simpleResponse.ok) {
      console.log('✅ Simple generation works!');
    } else {
      const error = await simpleResponse.text();
      console.error('❌ Simple generation error:', error);
    }
  } catch (error) {
    console.error('❌ Simple generation network error:', error.message);
  }
}

// Run tests
console.log('🧪 Starting Gemini API Tests...\n');
testGeminiApiKey().then(success => {
  if (success) {
    console.log('\n🎉 API Key is working correctly!');
    testApiEndpoints();
  } else {
    console.log('\n❌ API Key test failed. Check the errors above.');
  }
});

// Instructions for manual testing
console.log(`
📝 Manual Testing Instructions:

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Copy and paste this entire script
4. Press Enter to run
5. Check the results

Alternative test:
1. Go to: https://makersuite.google.com/app/apikey
2. Verify your API key is active
3. Check quota usage
4. Generate new key if needed
`);
