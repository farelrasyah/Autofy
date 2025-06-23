# 🔧 Troubleshooting Guide - Autofy Extension

## ❌ "Tidak dapat berkomunikasi dengan halaman form"

Masalah ini terjadi ketika popup extension tidak bisa berkomunikasi dengan content script di halaman Google Form. Berikut adalah solusi step-by-step:

### 🛠️ Solusi Cepat

1. **Refresh Halaman Form**
   ```
   - Tekan F5 atau Ctrl+R di halaman Google Form
   - Tunggu halaman selesai loading
   - Coba lagi menggunakan Autofy
   ```

2. **Reload Extension**
   ```
   - Buka chrome://extensions/
   - Klik tombol "Reload" di extension Autofy
   - Refresh halaman Google Form
   - Coba lagi
   ```

3. **Cek URL Halaman**
   ```
   - Pastikan URL mengandung: docs.google.com/forms/
   - Pastikan bukan halaman edit (harus viewform)
   - Contoh URL yang benar: 
     https://docs.google.com/forms/d/e/1FAIpQLSe.../viewform
   ```

### 🔍 Diagnosis Masalah

#### 1. Cek Content Script Status
- Buka popup Autofy
- Lihat status "Content Script" di bawah status AI
- Status yang mungkin muncul:
  - ✅ **Ready** - Content script berfungsi normal
  - ⏳ **Checking...** - Sedang mengecek status
  - ❌ **Needs Refresh** - Perlu refresh halaman

#### 2. Cek Console Browser
1. Tekan F12 di halaman Google Form
2. Buka tab "Console"
3. Cari pesan error dari Autofy
4. Pesan yang normal: "🤖 Autofy content script loaded"

#### 3. Cek Extension Permissions
1. Buka `chrome://extensions/`
2. Klik "Details" pada Autofy extension
3. Pastikan "Site access" diset ke "On specific sites"
4. Pastikan `docs.google.com` ada dalam daftar

### 🚨 Penyebab Umum

#### 1. **Content Script Belum Dimuat**
- **Gejala**: Popup terbuka tapi tidak ada response
- **Solusi**: Refresh halaman form dan tunggu loading selesai

#### 2. **URL Tidak Sesuai**
- **Gejala**: Extension tidak mendeteksi sebagai Google Form
- **Solusi**: Pastikan URL mengandung `/forms/` dan bukan `/forms/edit/`

#### 3. **Extension Permissions**
- **Gejala**: Extension tidak dapat mengakses halaman
- **Solusi**: Reinstall extension atau reset permissions

#### 4. **Conflict dengan Extension Lain**
- **Gejala**: Bekerja kadang-kadang saja
- **Solusi**: Disable extension lain yang berhubungan dengan forms

#### 5. **Browser Cache**
- **Gejala**: Extension tidak update setelah perubahan
- **Solusi**: Clear browser cache atau hard refresh (Ctrl+Shift+R)

### 🔧 Langkah Troubleshooting Lanjutan

#### 1. Manual Content Script Injection
Jika masalah persisten, popup akan otomatis mencoba inject content script secara manual:
```javascript
// Ini dilakukan otomatis oleh extension
chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ['content.js']
});
```

#### 2. Check Extension Logs
1. Buka `chrome://extensions/`
2. Aktifkan "Developer mode"
3. Klik "background page" atau "service worker" di Autofy
4. Cek console untuk error messages

#### 3. Test API Connection
- Klik "Test API Detail" di popup
- Pastikan API connection sukses
- Jika gagal, ada masalah dengan API key

### 📊 Status Codes

| Status | Arti | Solusi |
|--------|------|--------|
| `Receiving end does not exist` | Content script tidak loaded | Refresh halaman |
| `Timeout` | Content script tidak respond | Refresh dan tunggu loading |
| `Tab tidak valid` | Tab sudah ditutup/berubah | Buka form di tab baru |
| `Bukan Google Form` | URL tidak sesuai | Pastikan URL benar |

### 🆘 Jika Masih Tidak Bisa

1. **Reinstall Extension**
   ```
   - Hapus extension dari chrome://extensions/
   - Download ulang dari source
   - Install kembali
   ```

2. **Reset Browser**
   ```
   - Restart Chrome browser
   - Clear all browsing data
   - Reinstall extension
   ```

3. **Check Browser Compatibility**
   ```
   - Chrome version minimal: 88+
   - Manifest V3 support required
   - JavaScript enabled
   ```

### 📝 Report Bug

Jika masalah tetap ada, buat bug report dengan informasi:
- URL Google Form yang bermasalah
- Chrome version
- Error message dari console
- Screenshot popup Autofy
- Langkah-langkah yang sudah dicoba

### ✅ Pencegahan

1. **Selalu refresh halaman form** sebelum menggunakan Autofy
2. **Tunggu halaman loading selesai** sebelum membuka popup
3. **Pastikan URL correct** (viewform, bukan edit)
4. **Keep extension updated** ke versi terbaru
5. **Disable conflicting extensions** sementara

---

**💡 Tip**: Jika Autofy sering bermasalah di form tertentu, coba buka form di incognito mode dengan hanya Autofy extension yang aktif.
