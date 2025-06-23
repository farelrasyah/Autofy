# 🔧 DEBUG GUIDE - "Gagal mengisi pertanyaan"

## 🎯 Masalah: Pertanyaan tidak dapat dijawab

Jika Anda melihat pesan **"❌ Gagal mengisi pertanyaan"**, ikuti langkah debugging ini:

## 🔍 Step 1: Cek Console Browser

1. **Buka Developer Tools**
   - Tekan `F12` di halaman Google Form
   - Buka tab **Console**

2. **Reload Extension dan Halaman**
   ```
   1. Reload extension di chrome://extensions/
   2. Refresh halaman Google Form (F5)
   3. Tunggu hingga selesai loading
   ```

3. **Cek Pesan Loading**
   Pastikan Anda melihat pesan berikut di console:
   ```
   🚀 Initializing Autofy...
   📍 URL: [URL form]
   📍 Is Google Form: true
   ⚙️ Config loaded: true
   ✅ Using API key from protection system
   ✅ Gemini service initialized successfully
   ✅ Gemini API connection test passed
   ✅ Autofy initialized successfully
   ```

## 🔍 Step 2: Run Debug Tests

1. **Di console browser, jalankan:**
   ```javascript
   window.autofyDebug.runAllTests()
   ```

2. **Cek hasil test:**
   - ✅ components: PASSED
   - ✅ apiKey: PASSED  
   - ✅ geminiService: PASSED
   - ✅ formAnalysis: PASSED

3. **Jika ada yang FAILED, lihat troubleshooting di bawah**

## 🔍 Step 3: Test Manual Question Filling

```javascript
// Test pengisian pertanyaan individual
window.autofyDebug.testQuestionFilling()
```

## 🛠️ Troubleshooting berdasarkan Hasil Test

### ❌ Components: FAILED
**Masalah**: Script extension tidak ter-load
**Solusi**:
```
1. Buka chrome://extensions/
2. Klik "Reload" pada Autofy extension
3. Refresh halaman Google Form
4. Pastikan URL mengandung: docs.google.com/forms/*/viewform
```

### ❌ apiKey: FAILED  
**Masalah**: API key tidak dapat diakses
**Solusi**:
```
1. Cek di console: typeof ApiKeyProtection
2. Jika 'undefined', berarti api-protection.js tidak ter-load
3. Reload extension dan refresh halaman
```

### ❌ geminiService: FAILED
**Masalah**: Tidak dapat terhubung ke Gemini API
**Solusi**:
```
1. Cek koneksi internet
2. Test manual di console:
   const api = new ApiKeyProtection();
   console.log('API Key:', api.getApiKey().substring(0,10) + '...');
3. Jika API key kosong, ada masalah dengan api-protection.js
```

### ❌ formAnalysis: FAILED
**Masalah**: Tidak dapat menganalisis form
**Solusi**:
```
1. Pastikan Anda di halaman viewform (bukan edit)
2. URL harus seperti: .../forms/d/e/1FAI.../viewform
3. Tunggu form selesai loading sepenuhnya
4. Refresh halaman jika perlu
```

## 🔍 Step 4: Debug Detail saat Fill Form

1. **Buka popup Autofy**
2. **Klik "Fill Form with AI"**
3. **Monitor console untuk pesan debug:**

```
🚀 Starting fillAllQuestions...
✅ All services ready, starting form filling...
📊 Analyzing form...
📊 Form data: {...}
📊 Found questions: 5
📊 Questions to fill: 5
🎯 Processing 5 questions...

🔄 Processing question 1/5: What is your name
🤖 Generating answer with context: {...}
🤖 Generated answer: John Doe
📝 Filling answer into form...
📝 FormFiller.fillQuestion called with: {...}
📝 Filling short_answer question with answer: "John Doe"
📝 Fill result: true
✅ Successfully filled question 1
```

## 🚨 Error Patterns & Solutions

### Error: "Gemini service is not initialized"
```javascript
// Solusi: Cek inisialisasi API
const protection = new ApiKeyProtection();
const key = protection.getApiKey();
console.log('Key valid:', key && key.startsWith('AIza'));
```

### Error: "Form analyzer not initialized"
```javascript
// Solusi: Manual init
const analyzer = new FormAnalyzer();
const data = analyzer.analyzeForm();
console.log('Form questions:', data.questions.length);
```

### Error: "Empty answer generated"
```javascript
// Solusi: Test Gemini service
const service = new GeminiService(apiKey);
const answer = await service.generateAnswer('Test question', {});
console.log('Generated:', answer);
```

### Error: "Question input element not found"
```javascript
// Solusi: Cek form structure
const questions = document.querySelectorAll('[data-params*="question"]');
console.log('Form elements found:', questions.length);
```

## 🔧 Manual Testing Commands

```javascript
// Test komponen individual
window.autofyDebug.testComponentsLoaded()
window.autofyDebug.testApiKey()
window.autofyDebug.testGeminiService()
window.autofyDebug.testFormAnalysis()

// Test full flow
window.autofyDebug.runAllTests()

// Test question filling
window.autofyDebug.testQuestionFilling()

// Manual form fill test
const analyzer = new FormAnalyzer();
const filler = new FormFiller();
const service = new GeminiService(new ApiKeyProtection().getApiKey());

const form = analyzer.analyzeForm();
const question = form.questions[0];
const answer = await service.generateAnswer(question.text, {});
const result = await filler.fillQuestion(question, answer);
console.log('Manual fill result:', result);
```

## 📋 Checklist Debugging

- [ ] Extension ter-reload dengan benar
- [ ] Halaman Google Form ter-refresh
- [ ] URL form valid (mengandung /viewform)
- [ ] Console tidak ada error merah
- [ ] All components loaded (ConfigManager, GeminiService, dll)
- [ ] API key valid dan dapat diakses
- [ ] Gemini service connection test passed
- [ ] Form questions terdeteksi (> 0)
- [ ] Debug tests semua PASSED

## 🆘 Jika Masih Tidak Berfungsi

1. **Backup & Clean Install**
   ```
   1. Export bookmarks/data penting
   2. Hapus extension dari Chrome
   3. Clear browser data (cache, cookies)
   4. Restart browser
   5. Install extension fresh
   ```

2. **Test di Incognito Mode**
   ```
   1. Buka Chrome Incognito
   2. Enable extension di incognito
   3. Test di form sederhana
   ```

3. **Report Issue**
   ```
   Sertakan informasi:
   - Chrome version
   - URL form yang bermasalah  
   - Screenshot console errors
   - Hasil window.autofyDebug.runAllTests()
   ```

---

**💡 Tips**: Kebanyakan masalah diselesaikan dengan reload extension + refresh halaman form. Selalu coba ini dulu sebelum debugging lebih lanjut.
