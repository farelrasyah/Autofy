# 🎯 PANDUAN DEBUGGING: "Tidak Dapat Menjawab Soal"

## 🔍 Langkah Debugging Sistematis

### Step 1: Verifikasi Komponen Extension

```javascript
// Buka console (F12) di halaman Google Form dan jalankan:
window.autofyDebug.quickTest()
```

**Expected Output:**
```
✅ Components Loaded: true
✅ Form Analysis: true  
✅ Questions Found: [number > 0]
```

### Step 2: Analisis Detail Form

```javascript
// Jalankan analisis detail:
window.autofyDebug.analyzeFormDetailed()
```

**Yang harus dicek:**
- Apakah questions terdeteksi? (jumlah > 0)
- Apakah setiap question punya `inputElement`?
- Apakah question type terdeteksi dengan benar?

### Step 3: Test Manual Single Question

```javascript
// Test question pertama (index 0):
window.autofyDebug.testFillQuestion(0, "Test Answer")

// Test question kedua (index 1):
window.autofyDebug.testFillQuestion(1, "Test Answer")
```

### Step 4: Cari Semua Form Elements

```javascript
// Lihat semua form elements yang ada:
window.autofyDebug.findAllFormElements()
```

## 🛠️ Troubleshooting berdasarkan Hasil

### ❌ Masalah: "No questions found"

**Penyebab**: Form analyzer tidak bisa mendeteksi pertanyaan

**Solusi**:
1. Pastikan URL form benar (mengandung `/viewform`)
2. Tunggu form selesai loading
3. Cek manual di console:
   ```javascript
   // Cek apakah ada elements pertanyaan
   document.querySelectorAll('[data-params*="question"]').length
   document.querySelectorAll('[role="listitem"][data-params]').length
   ```

### ❌ Masalah: "inputElement: null"

**Penyebab**: Input element tidak ditemukan untuk pertanyaan

**Solusi**:
1. Cek jenis pertanyaan:
   ```javascript
   const analyzer = new FormAnalyzer();
   const formData = analyzer.analyzeForm();
   formData.questions.forEach(q => {
     console.log(`Question: ${q.text}`);
     console.log(`Type: ${q.type}`);
     console.log(`InputElement:`, q.inputElement);
   });
   ```

2. Cari input secara manual:
   ```javascript
   // Untuk text input:
   document.querySelectorAll('input[type="text"], .quantumWizTextinputPaperinputInput')
   
   // Untuk radio button:
   document.querySelectorAll('input[type="radio"], [role="radio"]')
   
   // Untuk textarea:
   document.querySelectorAll('textarea, [role="textbox"]')
   ```

### ❌ Masalah: "Fill result: false"

**Penyebab**: Form filler gagal mengisi jawaban

**Solusi**:
1. Test manual form filling:
   ```javascript
   // Get first question manually
   const analyzer = new FormAnalyzer();
   const questions = analyzer.analyzeForm().questions;
   const question = questions[0];
   
   // Test dengan input element langsung
   const input = question.inputElement;
   input.value = "Test Answer";
   input.dispatchEvent(new Event('input', { bubbles: true }));
   input.dispatchEvent(new Event('change', { bubbles: true }));
   ```

2. Cek apakah input bisa diisi:
   ```javascript
   const input = document.querySelector('input[type="text"]');
   if (input) {
     input.focus();
     input.value = "Manual test";
     console.log("Input value:", input.value);
   }
   ```

### ❌ Masalah: Question type salah terdeteksi

**Solusi**:
```javascript
// Debug question type detection
const containers = document.querySelectorAll('[data-params*="question"]');
containers.forEach((container, i) => {
  console.log(`\nQuestion ${i + 1}:`);
  console.log('Has radio:', !!container.querySelector('input[type="radio"]'));
  console.log('Has checkbox:', !!container.querySelector('input[type="checkbox"]'));
  console.log('Has textarea:', !!container.querySelector('textarea'));
  console.log('Has text input:', !!container.querySelector('input[type="text"]'));
  console.log('Has select:', !!container.querySelector('select'));
});
```

## 🔧 Commands untuk Testing Manual

### Test Individual Components:

```javascript
// 1. Test API Key
new ApiKeyProtection().getApiKey().substring(0, 10) + "..."

// 2. Test Gemini Service
const service = new GeminiService(new ApiKeyProtection().getApiKey());
await service.testConnection()

// 3. Test Form Analysis
const analyzer = new FormAnalyzer();
analyzer.analyzeForm()

// 4. Test Form Filling (question index 0)
const filler = new FormFiller();
const questions = analyzer.analyzeForm().questions;
await filler.fillQuestion(questions[0], "Test Answer")
```

### Test Full Flow:

```javascript
// Test semua pertanyaan dengan data dummy
window.autofyDebug.testFillAllQuestions()
```

### Test Real AI Response:

```javascript
// Generate real AI answer dan isi pertanyaan
const analyzer = new FormAnalyzer();
const filler = new FormFiller();
const service = new GeminiService(new ApiKeyProtection().getApiKey());

const questions = analyzer.analyzeForm().questions;
const question = questions[0]; // First question

// Generate AI answer
const answer = await service.generateAnswer(question.text, {
  questionType: question.type,
  options: question.options,
  language: 'id',
  responseStyle: 'natural'
});

console.log('AI Answer:', answer);

// Fill with AI answer
const result = await filler.fillQuestion(question, answer);
console.log('Fill Result:', result);
```

## 📋 Checklist Diagnosis

### ✅ Basic Checks:
- [ ] Extension ter-reload
- [ ] Halaman form ter-refresh
- [ ] URL contains `/viewform`
- [ ] Form fully loaded (no loading spinners)
- [ ] No console errors (red text)

### ✅ Component Checks:
- [ ] `typeof ConfigManager !== 'undefined'`
- [ ] `typeof GeminiService !== 'undefined'`
- [ ] `typeof FormAnalyzer !== 'undefined'`
- [ ] `typeof FormFiller !== 'undefined'`

### ✅ Form Analysis Checks:
- [ ] Questions detected (> 0)
- [ ] Each question has inputElement
- [ ] Question types correctly identified
- [ ] Question text extracted properly

### ✅ Form Filling Checks:
- [ ] Input elements focusable
- [ ] Input elements accept value changes
- [ ] Events trigger properly
- [ ] Form recognizes input changes

## 🆘 Advanced Debugging

### Monitor Form Filling Real-time:

```javascript
// Enable verbose logging
window.autofyDebugVerbose = true;

// Watch for form changes
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
      console.log('Form value changed:', mutation.target, mutation.target.value);
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  subtree: true,
  attributeFilter: ['value']
});
```

### Test Google Form Events:

```javascript
// Test if Google Form recognizes synthetic events
const input = document.querySelector('input[type="text"]');
if (input) {
  input.value = "Test";
  
  // Test different event combinations
  ['input', 'change', 'blur', 'focus'].forEach(eventType => {
    input.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
  
  // Check if form state changed
  setTimeout(() => {
    console.log('Input value after events:', input.value);
  }, 1000);
}
```

---

## 💡 Tips Debugging

1. **Selalu mulai dengan `window.autofyDebug.quickTest()`**
2. **Cek console untuk error messages yang detail**
3. **Test manual dengan input langsung jika automated filling gagal**
4. **Gunakan selector inspection untuk element detection**
5. **Verify form changes dengan mutation observer**

Jika masih tidak bisa, share hasil dari `quickTest()` dan specific error messages! 🎯
