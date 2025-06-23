/**
 * Simple API Test Script
 * Script untuk test koneksi Gemini API
 */

// Test API key yang sudah di-encode
const testApiKey = () => {
  // Decode base64 API key
  const encodedKey = 'QUl6YVN5QVJJS3dubHJVZUl4cEd2VFM1VmhSeHVSMkhoV1FDeG9Z';
  const apiKey = atob(encodedKey);
  
  console.log('🔑 API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
  console.log('📏 API Key length:', apiKey.length);
  console.log('✅ API Key format valid:', apiKey.startsWith('AIza'));
  
  return apiKey;
};

// Test Gemini API connection
const testGeminiConnection = async () => {
  const apiKey = testApiKey();
  
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: 'Say "Hello from Autofy Extension!" in a friendly way' }] 
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 50
          }
        })
      }
    );
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      console.log('✅ API Connection successful!');
      console.log('🤖 Generated response:', generatedText);
      return { success: true, response: generatedText };
    } else {
      const errorData = await response.text();
      console.error('❌ API Error:', response.status, errorData);
      return { success: false, error: `${response.status}: ${errorData}` };
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return { success: false, error: error.message };
  }
};

// Jalankan test jika script ini dijalankan langsung
if (typeof window !== 'undefined') {
  // Running in browser
  console.log('🎯 Running Autofy API Test in browser...');
  testGeminiConnection().then(result => {
    console.log('🏁 Test completed:', result);
  });
} else {
  // Export for use in extension
  window.testGeminiConnection = testGeminiConnection;
}

console.log('🔧 Autofy API Test script loaded');
