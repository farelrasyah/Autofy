# 🤖 Autofy - AI-Powered Google Form Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)

**Autofy** adalah Chrome Extension yang menggunakan kekuatan **Google Gemini AI** untuk mengisi Google Form secara otomatis dan cerdas. Extension ini dapat menganalisis pertanyaan dalam form dan memberikan jawaban yang relevan berdasarkan konteks.

## ✨ Fitur Utama

- 🧠 **AI-Powered Responses** - Menggunakan Gemini AI untuk menghasilkan jawaban yang cerdas dan kontekstual
- 🔍 **Smart Form Analysis** - Menganalisis struktur dan jenis pertanyaan secara otomatis
- ⚡ **Auto-Fill Multiple Types** - Mendukung berbagai jenis input (text, radio, checkbox, dropdown, dll.)
- 🎨 **Modern UI** - Interface yang clean, intuitive, dan responsive
- ⚙️ **Customizable Settings** - Berbagai pengaturan untuk menyesuaikan gaya respons
- 🌐 **Multi-Language** - Mendukung Bahasa Indonesia dan English
- 🔒 **Secure API Management** - Pengelolaan API key yang aman dengan enkripsi lokal

## 🚀 Instalasi

### Metode 1: Development Mode

1. **Clone atau Download Repository**
   ```bash
   git clone https://github.com/your-username/autofy-extension.git
   cd autofy-extension
   ```

2. **Setup Environment**
   ```bash
   npm run setup
   ```
   Atau manual:
   ```bash
   copy .env.example .env
   ```

3. **Konfigurasi API Key**
   - Edit file `.env`
   - Masukkan API key Gemini Anda:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Load Extension di Chrome**
   - Buka `chrome://extensions/`
   - Aktifkan "Developer mode"
   - Klik "Load unpacked"
   - Pilih folder project Autofy

### Metode 2: Production Build

1. **Build Extension**
   ```bash
   npm run build
   ```

2. **Install dari Build Folder**
   - Buka `chrome://extensions/`
   - Aktifkan "Developer mode"
   - Klik "Load unpacked"
   - Pilih folder `build/`

## 🔑 Mendapatkan Gemini API Key

1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google Anda
3. Klik "Create API Key"
4. Salin API key yang dihasilkan
5. Masukkan ke file `.env` atau pengaturan extension

> **Catatan**: API key Gemini tersedia gratis dengan quota tertentu per bulan.

## 📖 Cara Penggunaan

### Langkah Dasar

1. **Buka Google Form**
   - Navigasi ke form Google yang ingin diisi
   - Pastikan form dalam mode "viewform" (bukan edit)

2. **Aktifkan Autofy**
   - Klik icon Autofy di toolbar Chrome, atau
   - Tekan shortcut `Ctrl+Shift+A`

3. **Analisis Form**
   - Klik tombol "🔍 Analisis Form"
   - Autofy akan menganalisis semua pertanyaan dalam form

4. **Isi Form Otomatis**
   - Klik "✨ Isi Semua Pertanyaan" untuk mengisi seluruh form
   - Atau "📝 Isi Yang Belum Dijawab" untuk mengisi yang kosong saja

5. **Review & Submit**
   - Periksa jawaban yang dihasilkan
   - Edit jika diperlukan
   - Submit form seperti biasa

### Fitur Lanjutan

#### Shortcut Keyboard
- `Ctrl+Shift+A` - Toggle panel Autofy
- `Ctrl+Shift+F` - Isi semua pertanyaan (saat panel terbuka)

#### Kustomisasi Gaya Respons
- **Natural** - Jawaban yang conversational dan natural
- **Formal** - Jawaban yang profesional dan formal
- **Brief** - Jawaban yang singkat dan to-the-point

#### Pengaturan Kecepatan
- **Lambat** - Meniru kecepatan mengetik manusia (lebih natural)
- **Normal** - Kecepatan sedang
- **Cepat** - Mengisi dengan cepat

## 🛠️ Struktur Project

```
Autofy/
├── manifest.json          # Chrome extension manifest
├── background.js          # Service worker
├── content.js            # Content script utama
├── config.js             # Configuration manager
├── gemini-service.js     # Gemini AI integration
├── form-analyzer.js      # Google Form analyzer
├── form-filler.js        # Automatic form filler
├── popup.html           # Popup interface
├── popup.js             # Popup logic
├── styles.css           # CSS styling
├── build.js             # Build script
├── package.json         # NPM configuration
├── .env.example         # Environment template
├── .env                 # Environment variables (secret)
├── .gitignore          # Git ignore rules
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## ⚙️ Konfigurasi Lanjutan

### Environment Variables

```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
```

### Chrome Storage Settings

Extension menyimpan pengaturan di Chrome storage dengan struktur:

```javascript
{
  geminiApiKey: "string",
  responseStyle: "natural|formal|brief", 
  language: "id|en",
  fillSpeed: "slow|normal|fast",
  autoFillEnabled: boolean,
  notifications: boolean
}
```

## 🔧 Development

### Prerequisites

- Node.js 14+
- Chrome Browser 88+

### Setup Development

```bash
# Clone repository
git clone https://github.com/your-username/autofy-extension.git
cd autofy-extension

# Setup environment
npm run setup

# Configure API key
# Edit .env file with your Gemini API key

# Load extension in Chrome
# Go to chrome://extensions/ -> Load unpacked
```

### Available Scripts

```bash
npm run dev          # Development mode
npm run build        # Build for production
npm run build:interactive # Interactive build
npm run package      # Build and create ZIP
npm run clean        # Clean build directory
npm run setup        # Setup environment files
```

### Build Process

Build script akan:
1. Membuat folder `build/`
2. Menyalin semua file yang diperlukan
3. Mengganti placeholder `__GEMINI_API_KEY__` dengan API key dari `.env`
4. Update version number
5. Generate build README

## 🎯 Jenis Pertanyaan yang Didukung

- ✅ **Short Answer** - Text input pendek
- ✅ **Paragraph** - Text area panjang  
- ✅ **Multiple Choice** - Radio buttons
- ✅ **Checkboxes** - Multiple selection
- ✅ **Dropdown** - Select options
- ✅ **Linear Scale** - Rating scale
- ✅ **Date** - Date picker
- ✅ **Time** - Time picker
- ✅ **Email** - Email input
- ✅ **URL** - URL input
- ✅ **Number** - Number input
- ❌ **File Upload** - Belum didukung

## 🔒 Keamanan & Privacy

- **API Key Encryption** - API key disimpan secara aman di Chrome storage
- **No Data Collection** - Extension tidak mengumpulkan data pengguna
- **Local Processing** - Semua operasi dilakukan secara lokal
- **HTTPS Only** - Komunikasi dengan Gemini API menggunakan HTTPS
- **Minimal Permissions** - Extension hanya meminta permission yang diperlukan

## 🚨 Troubleshooting

### Extension Tidak Muncul di Google Form

1. Pastikan URL adalah halaman Google Form yang valid
2. Refresh halaman
3. Periksa console browser untuk error messages
4. Pastikan extension aktif di `chrome://extensions/`

### API Key Error

1. Periksa format API key (harus dimulai dengan "AIza")
2. Pastikan API key valid di [Google AI Studio](https://makersuite.google.com/)
3. Cek quota API key Anda
4. Test koneksi di pengaturan extension

### Form Tidak Terisi

1. Coba analisis ulang form
2. Periksa jenis pertanyaan yang didukung
3. Pastikan form tidak memiliki validasi khusus
4. Coba dengan kecepatan pengisian yang lebih lambat

### Extension Tidak Load

1. Periksa file manifest.json
2. Pastikan semua file ada dan tidak corrupt
3. Coba reload extension di `chrome://extensions/`
4. Periksa console untuk error messages

## 📝 Changelog

### v1.0.0 (2025-06-14)
- ✨ Initial release
- 🧠 Gemini AI integration
- 🎨 Modern UI design
- ⚙️ Comprehensive settings
- 🌐 Multi-language support
- 🔒 Secure API management

## 🤝 Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini dilisensikan under MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 👨‍💻 Author

**Farel Rasyah**
- GitHub: [@your-username](https://github.com/your-username)
- Email: your-email@example.com

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) untuk API AI yang powerful
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/) untuk panduan development
- Komunitas open source untuk inspirasi dan dukungan

## ⭐ Support

Jika project ini bermanfaat, berikan ⭐ di GitHub!

---

<p align="center">
  Dibuat dengan ❤️ oleh <a href="https://github.com/your-username">Farel Rasyah</a>
</p>
