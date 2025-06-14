# 🧪 Panduan Testing Autofy Extension di Chrome

## 📋 Persiapan Sebelum Testing

### 1. Setup Environment
```bash
# Pastikan file .env sudah ada dengan API key
GEMINI_API_KEY=AIzaSyARIKwnlrUeIxpGvTS5VhRxuR2HhWQCxoY
```

### 2. Validasi File Extension
```bash
# Jalankan validasi untuk memastikan semua file lengkap
node dev-utils.js validate
```

## 🚀 Cara Install & Load Extension di Chrome

### Method 1: Development Mode (Recommended untuk Testing)

1. **Buka Chrome Extensions Manager**
   - Ketik di address bar: `chrome://extensions/`
   - Atau Menu Chrome → More Tools → Extensions

2. **Aktifkan Developer Mode**
   - Toggle "Developer mode" di pojok kanan atas
   - Button harus dalam posisi ON (biru)

3. **Load Extension**
   - Klik tombol "Load unpacked"
   - Navigate ke folder: `d:\Project Extension Farel Rasyah\Autofy`
   - Pilih folder utama (bukan subfolder)
   - Klik "Select Folder"

4. **Verifikasi Installation**
   - Extension "Autofy - Google Form AI Assistant" akan muncul
   - Icon Autofy akan muncul di toolbar Chrome
   - Status harus "Enabled"

### Method 2: Production Build Mode

```bash
# Build extension dulu
npm run build

# Lalu load folder "build" instead of root folder
```

## 🔍 Testing Steps

### Phase 1: Basic Extension Testing

1. **Check Extension Status**
   - Buka `chrome://extensions/`
   - Pastikan Autofy extension aktif (tidak ada error)
   - Klik "Details" untuk melihat permissions

2. **Test Extension Icon**
   - Look for Autofy icon di toolbar Chrome
   - Klik icon → harus membuka popup settings
   - Coba semua menu di popup

3. **Test API Key Configuration**
   - Buka popup Autofy
   - Masukkan API key di pengaturan
   - Klik "Test Koneksi Gemini"
   - Harus menunjukkan "✅ Koneksi berhasil"

### Phase 2: Google Form Testing

1. **Buka Google Form Test**
   ```
   # Buat form test sederhana atau gunakan form publik:
   https://docs.google.com/forms/d/e/1FAIpQLSf...../viewform
   
   # Atau buat form sendiri dengan berbagai jenis pertanyaan:
   - Short answer
   - Paragraph  
   - Multiple choice
   - Checkboxes
   - Dropdown
   - Date
   - Email
   ```

2. **Test Autofy Activation**
   - Setelah form terbuka, icon Autofy harus menunjukkan badge "✓"
   - Klik icon Autofy atau tekan `Ctrl+Shift+A`
   - Panel Autofy harus muncul di kanan

3. **Test Form Analysis**
   - Klik "🔍 Analisis Form"
   - Harus menunjukkan jumlah pertanyaan yang ditemukan
   - Status berubah menjadi "✅ Ditemukan X pertanyaan"

4. **Test Auto-Fill**
   - Klik "✨ Isi Semua Pertanyaan"
   - Observe filling process dengan progress bar
   - Semua field yang supported harus terisi otomatis

### Phase 3: Advanced Testing

1. **Test Different Question Types**
   ```
   ✅ Short Answer: "Nama Anda?"
   ✅ Email: "Email address"
   ✅ Multiple Choice: "Pilihan favorit?"
   ✅ Checkboxes: "Hobi Anda? (pilih beberapa)"
   ✅ Dropdown: "Kota asal"
   ✅ Paragraph: "Ceritakan pengalaman Anda"
   ✅ Date: "Tanggal lahir"
   ✅ Number: "Umur Anda"
   ```

2. **Test Settings Variations**
   - Ganti Response Style: Natural → Formal → Brief
   - Ganti Language: Indonesia → English
   - Ganti Fill Speed: Slow → Normal → Fast
   - Test setiap kombinasi

3. **Test Error Handling**
   - Test dengan API key salah
   - Test di halaman non-Google Form
   - Test dengan form yang kompleks/unusual

## 🐛 Debugging & Troubleshooting

### Console Debugging

1. **Background Script Console**
   ```bash
   # Cara akses:
   1. Go to chrome://extensions/
   2. Find Autofy extension
   3. Click "Inspect views: background page"
   4. Check console untuk error messages
   ```

2. **Content Script Console**
   ```bash
   # Cara akses:
   1. Buka Google Form di tab
   2. Right-click → Inspect Element
   3. Go to Console tab
   4. Look for Autofy messages (🤖 prefix)
   ```

3. **Popup Console**
   ```bash
   # Cara akses:
   1. Right-click pada Autofy icon
   2. Select "Inspect popup"
   3. Check console untuk errors
   ```

### Common Issues & Solutions

1. **Extension Tidak Muncul**
   ```
   ❌ Issue: Icon tidak ada di toolbar
   ✅ Solution: 
   - Check chrome://extensions/ apakah enabled
   - Try pin extension ke toolbar
   - Restart Chrome browser
   ```

2. **API Connection Failed**
   ```
   ❌ Issue: "❌ Koneksi gagal"
   ✅ Solution:
   - Verify API key di https://makersuite.google.com/app/apikey
   - Check internet connection
   - Check API quota
   ```

3. **Form Tidak Terdeteksi**
   ```
   ❌ Issue: Badge tidak muncul di Google Form
   ✅ Solution:
   - Refresh halaman form
   - Check URL apakah benar-benar Google Form
   - Check console untuk errors
   ```

4. **Auto-Fill Tidak Bekerja**
   ```
   ❌ Issue: Fields tidak terisi
   ✅ Solution:
   - Check question types yang supported
   - Try slower fill speed
   - Check for form validation yang strict
   ```

## 📊 Testing Checklist

### ✅ Pre-Installation
- [ ] File .env exists dengan valid API key
- [ ] All required files present
- [ ] No syntax errors in JavaScript files
- [ ] Manifest.json valid

### ✅ Installation
- [ ] Extension loads without errors
- [ ] Icon appears in toolbar
- [ ] Popup opens correctly
- [ ] Settings can be configured

### ✅ Basic Functionality
- [ ] API connection test passes
- [ ] Form detection works
- [ ] Form analysis shows correct question count
- [ ] Auto-fill completes successfully

### ✅ Advanced Features
- [ ] All question types handled correctly
- [ ] Different response styles work
- [ ] Speed settings function properly
- [ ] Error handling works appropriately

### ✅ Edge Cases
- [ ] Works with required/optional questions
- [ ] Handles forms with validation
- [ ] Manages large forms (10+ questions)
- [ ] Recovers from network errors

## 🎯 Quick Test Commands

```bash
# Setup dan validasi
npm run setup
node dev-utils.js validate

# Generate test data
node dev-utils.js test-data

# Create development documentation
node dev-utils.js docs

# Build untuk production testing
npm run build
```

## 📝 Test Form Templates

### Simple Test Form
```
1. Name (Short answer) - Required
2. Email (Email) - Required  
3. Rating (Multiple choice: Excellent, Good, Fair, Poor)
4. Comments (Paragraph) - Optional
```

### Complex Test Form
```
1. Personal Info (Short answer)
2. Birth Date (Date)
3. Age (Number)
4. Hobbies (Checkboxes: Reading, Sports, Music, Travel)
5. Country (Dropdown)
6. Website (URL)
7. Description (Paragraph)
8. Experience Rating (Linear scale 1-5)
```

## 🔄 Continuous Testing

1. **Daily Testing**
   - Test basic functionality
   - Check API connection
   - Verify form detection

2. **Weekly Testing**
   - Test dengan form types yang berbeda
   - Check performance dengan large forms
   - Validate new Google Form updates

3. **Before Release**
   - Full regression testing
   - Cross-browser compatibility
   - Performance benchmarking

---

## 🚨 Emergency Troubleshooting

Jika extension completely broken:

1. **Reset Extension**
   ```bash
   # Remove dan re-add extension
   1. Go to chrome://extensions/
   2. Click "Remove" pada Autofy
   3. Load ulang dari folder
   ```

2. **Clear Extension Data**
   ```bash
   # Clear stored settings
   1. Open Chrome DevTools
   2. Go to Application tab
   3. Clear Extension storage
   ```

3. **Fallback Mode**
   ```bash
   # Test tanpa build
   1. Load langsung dari source folder
   2. Check individual components
   3. Use manual debugging
   ```

Happy Testing! 🧪🚀
