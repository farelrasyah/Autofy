/**
 * Gemini AI Service untuk Autofy Extension
 * Mengelola komunikasi dengan Google Gemini API
 */
class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-1.5-flash-latest';
    this.apiProtection = new ApiKeyProtection();
  }

  /**
   * Update API key (untuk retry dengan key berbeda)
   */
  updateApiKey(newApiKey) {
    this.apiKey = newApiKey;
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection() {
    try {
      console.log('🧪 Testing Gemini API connection...');
      
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
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
              maxOutputTokens: 10,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: `API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}` 
        };
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        return { 
          success: false, 
          error: 'Invalid response format from API' 
        };
      }

      console.log('✅ Gemini API connection test successful');
      return { success: true, response: data.candidates[0].content.parts[0].text };
      
    } catch (error) {
      console.error('❌ Gemini API connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Menghasilkan jawaban menggunakan Gemini AI dengan retry logic
   */
  async generateAnswer(question, context = {}) {
    return await this.generateAnswerWithRetry(question, context, 0);
  }

  /**
   * Generate answer dengan retry mechanism untuk quota exceeded
   */
  async generateAnswerWithRetry(question, context = {}, retryCount = 0) {
    const maxRetries = 3;
    
    if (!this.apiKey) {
      throw new Error('API key Gemini tidak ditemukan');
    }

    const prompt = this.createPrompt(question, context);
    
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1000,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Unknown error';
        
        // Handle quota exceeded error
        if (errorMessage.includes('quota') || errorMessage.includes('QUOTA') || 
            errorMessage.includes('exceeded') || response.status === 429) {
          
          console.warn(`🚫 API quota exceeded for current key, retry count: ${retryCount}`);
          
          // Mark current API key as quota exceeded
          this.apiProtection.markQuotaExceeded(this.apiKey, errorMessage);
          
          // Try with next API key if retries available
          if (retryCount < maxRetries) {
            const nextApiKey = this.apiProtection.getNextApiKey();
            if (nextApiKey && nextApiKey !== this.apiKey) {
              console.log(`🔄 Switching to backup API key, attempt ${retryCount + 1}/${maxRetries}`);
              this.updateApiKey(nextApiKey);
              
              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              return await this.generateAnswerWithRetry(question, context, retryCount + 1);
            }
          }
          
          // If all retries exhausted, provide demo answer
          console.warn('🎭 All API keys quota exceeded, providing demo answer');
          return this.getDemoAnswer(question, context);
        }
        
        throw new Error(`Gemini API Error: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Tidak ada respons dari Gemini AI');
      }

      return this.processResponse(data.candidates[0].content.parts[0].text, context);    } catch (error) {
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('🌐 Network error calling Gemini API:', error.message);
        
        // If it's a network error but not quota, try demo answer
        if (!error.message.includes('quota')) {
          console.warn('🎭 Network issue, providing demo answer');
          return this.getDemoAnswer(question, context);
        }
      }
      
      // If it's a quota error and we have retries left, don't log as error yet
      if (error.message.includes('quota') && retryCount < maxRetries) {
        console.warn(`Quota error, retrying... (${retryCount + 1}/${maxRetries})`);
        return await this.generateAnswerWithRetry(question, context, retryCount + 1);
      }
      
      console.error('Error calling Gemini API:', error);
      
      // For any other errors, provide demo answer as fallback
      if (retryCount >= maxRetries || !error.message.includes('quota')) {
        console.warn('🎭 API error, providing demo answer as fallback');
        return this.getDemoAnswer(question, context);
      }
      
      throw error;
    }
  }

  /**
   * Membuat prompt yang optimal untuk berbagai jenis pertanyaan
   */
  createPrompt(question, context) {
    const { questionType, options, language = 'id', responseStyle = 'natural' } = context;
    
    let basePrompt = '';
    
    if (language === 'id') {
      basePrompt = `Anda adalah asisten AI yang membantu mengisi Google Form. Jawab pertanyaan berikut dengan akurat dan sesuai konteks.

Pertanyaan: "${question}"`;
    } else {
      basePrompt = `You are an AI assistant helping to fill Google Forms. Answer the following question accurately and contextually.

Question: "${question}"`;
    }

    // Tambahkan instruksi berdasarkan jenis pertanyaan
    switch (questionType) {
      case 'multiple_choice':
        if (options && options.length > 0) {
          basePrompt += language === 'id' 
            ? `\n\nPilihan yang tersedia: ${options.join(', ')}\nJawab dengan memilih salah satu dari pilihan di atas.`
            : `\n\nAvailable options: ${options.join(', ')}\nAnswer by choosing one of the options above.`;
        }
        break;
      
      case 'checkbox':
        if (options && options.length > 0) {
          basePrompt += language === 'id'
            ? `\n\nPilihan yang tersedia: ${options.join(', ')}\nAnda bisa memilih lebih dari satu. Pisahkan dengan koma jika memilih beberapa.`
            : `\n\nAvailable options: ${options.join(', ')}\nYou can choose multiple options. Separate with comma if selecting multiple.`;
        }
        break;
      
      case 'short_answer':
        basePrompt += language === 'id'
          ? '\n\nBerikan jawaban singkat dan tepat.'
          : '\n\nProvide a short and precise answer.';
        break;
      
      case 'paragraph':
        if (responseStyle === 'brief') {
          basePrompt += language === 'id'
            ? '\n\nBerikan jawaban dalam 1-2 kalimat yang padat dan informatif.'
            : '\n\nProvide answer in 1-2 concise and informative sentences.';
        } else {
          basePrompt += language === 'id'
            ? '\n\nBerikan jawaban yang detail dan komprehensif dalam bentuk paragraf.'
            : '\n\nProvide a detailed and comprehensive answer in paragraph form.';
        }
        break;
      
      case 'email':
        basePrompt += language === 'id'
          ? '\n\nJawab dengan format email yang valid (contoh: nama@domain.com).'
          : '\n\nAnswer with valid email format (example: name@domain.com).';
        break;
      
      case 'url':
        basePrompt += language === 'id'
          ? '\n\nJawab dengan URL yang valid (dimulai dengan http:// atau https://).'
          : '\n\nAnswer with valid URL (starting with http:// or https://).';
        break;
      
      case 'number':
        basePrompt += language === 'id'
          ? '\n\nJawab hanya dengan angka.'
          : '\n\nAnswer with numbers only.';
        break;
      
      case 'date':
        basePrompt += language === 'id'
          ? '\n\nJawab dengan format tanggal yang sesuai (DD/MM/YYYY atau format yang diminta).'
          : '\n\nAnswer with appropriate date format (DD/MM/YYYY or requested format).';
        break;
      
      case 'time':
        basePrompt += language === 'id'
          ? '\n\nJawab dengan format waktu (HH:MM).'
          : '\n\nAnswer with time format (HH:MM).';
        break;
    }

    // Tambahkan instruksi gaya respons
    if (responseStyle === 'formal') {
      basePrompt += language === 'id'
        ? '\n\nGunakan bahasa formal dan profesional.'
        : '\n\nUse formal and professional language.';
    } else if (responseStyle === 'brief') {
      basePrompt += language === 'id'
        ? '\n\nJawab sesingkat mungkin namun tetap informatif.'
        : '\n\nAnswer as briefly as possible while remaining informative.';
    }

    return basePrompt;
  }

  /**
   * Memproses respons dari Gemini untuk format yang sesuai
   */
  processResponse(response, context) {
    const { questionType, options } = context;
    
    // Bersihkan respons
    let cleanedResponse = response.trim();
    
    // Hapus markdown formatting jika ada
    cleanedResponse = cleanedResponse.replace(/\*\*(.*?)\*\*/g, '$1');
    cleanedResponse = cleanedResponse.replace(/\*(.*?)\*/g, '$1');
    
    // Proses berdasarkan jenis pertanyaan
    switch (questionType) {
      case 'multiple_choice':
        if (options && options.length > 0) {
          // Cari pilihan yang paling cocok
          const matchedOption = options.find(option => 
            cleanedResponse.toLowerCase().includes(option.toLowerCase()) ||
            option.toLowerCase().includes(cleanedResponse.toLowerCase())
          );
          if (matchedOption) {
            return matchedOption;
          }
        }
        break;
      
      case 'checkbox':
        if (options && options.length > 0) {
          // Cari semua pilihan yang cocok
          const matchedOptions = options.filter(option =>
            cleanedResponse.toLowerCase().includes(option.toLowerCase())
          );
          if (matchedOptions.length > 0) {
            return matchedOptions;
          }
        }
        break;
      
      case 'email':
        // Ekstrak email dari respons
        const emailMatch = cleanedResponse.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          return emailMatch[0];
        }
        break;
      
      case 'url':
        // Ekstrak URL dari respons
        const urlMatch = cleanedResponse.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          return urlMatch[0];
        }
        break;
      
      case 'number':
        // Ekstrak angka dari respons
        const numberMatch = cleanedResponse.match(/\d+(\.\d+)?/);
        if (numberMatch) {
          return numberMatch[0];
        }
        break;
    }
    
    return cleanedResponse;
  }

  /**
   * Tes koneksi ke Gemini API
   */
  async testConnection() {
    try {
      console.log('🧪 Menguji koneksi ke API Gemini...');
      
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Uji koneksi - jawab dengan "OK"'
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: `API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}` 
        };
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        return { 
          success: false, 
          error: 'Format respons tidak valid dari API' 
        };
      }

      console.log('✅ Tes koneksi API Gemini berhasil');
      return { success: true, response: data.candidates[0].content.parts[0].text };
      
    } catch (error) {
      console.error('❌ Tes koneksi API Gemini gagal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Provide demo answers when API quota is exceeded
   */
  getDemoAnswer(question, context = {}) {
    console.log('🎭 Providing demo answer for:', question);
    
    const { questionType } = context;
    const questionLower = question.toLowerCase();
    
    // Demo answers based on question type and content
    if (questionType === 'multiple_choice') {
      return 'A'; // Default first option
    } else if (questionType === 'checkbox') {
      return ['Option 1']; // Default first option
    } else if (questionLower.includes('nama') || questionLower.includes('name')) {
      return 'Demo User';
    } else if (questionLower.includes('email')) {
      return 'demo@example.com';
    } else if (questionLower.includes('telepon') || questionLower.includes('phone')) {
      return '081234567890';
    } else if (questionLower.includes('alamat') || questionLower.includes('address')) {
      return 'Jakarta, Indonesia';
    } else if (questionLower.includes('umur') || questionLower.includes('age')) {
      return '25';
    } else if (questionLower.includes('tanggal') || questionLower.includes('date')) {
      return new Date().toISOString().split('T')[0]; // Current date
    } else if (questionLower.includes('waktu') || questionLower.includes('time')) {
      return new Date().toTimeString().split(' ')[0]; // Current time
    } else if (questionLower.includes('website') || questionLower.includes('url')) {
      return 'https://example.com';
    } else if (questionLower.includes('perusahaan') || questionLower.includes('company')) {
      return 'Demo Company';
    } else if (questionLower.includes('pekerjaan') || questionLower.includes('job')) {
      return 'Software Developer';
    } else {
      // Generic text response
      return 'Demo response - API quota exceeded, using fallback answer';
    }
  }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiService;
} else {
  window.GeminiService = GeminiService;
}
