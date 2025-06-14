#!/usr/bin/env node

/**
 * Build Script untuk Autofy Extension
 * Mengganti placeholder dengan API key dari .env file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BUILD_DIR = './build';
const ENV_FILE = './.env';

/**
 * Baca file .env
 */
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    console.log('⚠️  File .env tidak ditemukan. Silakan salin dari .env.example');
    return null;
  }

  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  return envVars;
}

/**
 * Buat direktori build
 */
function createBuildDir() {
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  console.log('📁 Build directory created');
}

/**
 * Salin file ke build directory
 */
function copyFiles() {
  const filesToCopy = [
    'manifest.json',
    'background.js',
    'content.js',
    'config.js',
    'gemini-service.js',
    'form-analyzer.js',
    'form-filler.js',
    'popup.html',
    'popup.js',
    'styles.css'
  ];

  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(BUILD_DIR, file));
      console.log(`📄 Copied: ${file}`);
    } else {
      console.warn(`⚠️  File not found: ${file}`);
    }
  });

  // Copy icons directory if exists
  if (fs.existsSync('./icons')) {
    fs.mkdirSync(path.join(BUILD_DIR, 'icons'), { recursive: true });
    const iconFiles = fs.readdirSync('./icons');
    iconFiles.forEach(icon => {
      fs.copyFileSync(
        path.join('./icons', icon),
        path.join(BUILD_DIR, 'icons', icon)
      );
    });
    console.log('🎨 Copied icons');
  }
}

/**
 * Replace placeholder dengan API key
 */
function replaceApiKey(envVars) {
  if (!envVars || !envVars.GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY tidak ditemukan di .env file');
    return;
  }

  const configFile = path.join(BUILD_DIR, 'config.js');
  
  if (fs.existsSync(configFile)) {
    let content = fs.readFileSync(configFile, 'utf8');
    content = content.replace('__GEMINI_API_KEY__', envVars.GEMINI_API_KEY);
    fs.writeFileSync(configFile, content);
    console.log('🔑 API key replaced in config.js');
  }
}

/**
 * Update manifest version
 */
function updateVersion() {
  const manifestFile = path.join(BUILD_DIR, 'manifest.json');
  
  if (fs.existsSync(manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const currentVersion = manifest.version;
    
    // Auto increment patch version
    const versionParts = currentVersion.split('.');
    versionParts[2] = parseInt(versionParts[2]) + 1;
    manifest.version = versionParts.join('.');
    
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    console.log(`📦 Version updated: ${currentVersion} → ${manifest.version}`);
  }
}

/**
 * Create README untuk build
 */
function createBuildReadme() {
  const readme = `# Autofy Extension - Production Build

## Instalasi

1. Buka Chrome dan ketik \`chrome://extensions/\`
2. Aktifkan "Developer mode" di pojok kanan atas
3. Klik "Load unpacked" dan pilih folder build ini
4. Extension akan terinstall dan siap digunakan

## Konfigurasi

1. Klik icon Autofy di toolbar Chrome
2. Masukkan API key Gemini Anda di pengaturan
3. Sesuaikan preferensi sesuai kebutuhan
4. Buka Google Form dan mulai gunakan Autofy!

## Cara Penggunaan

1. Buka halaman Google Form
2. Klik icon Autofy atau tekan Ctrl+Shift+A
3. Klik "Analisis Form" untuk menganalisis pertanyaan
4. Klik "Isi Semua Pertanyaan" untuk mengisi otomatis
5. Review dan edit jawaban jika diperlukan

## Troubleshooting

- Pastikan API key Gemini valid dan memiliki quota
- Coba refresh halaman Google Form jika extension tidak muncul
- Periksa console browser untuk error messages

Built on: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(BUILD_DIR, 'README.md'), readme);
  console.log('📖 Build README created');
}

/**
 * Main build function
 */
async function build() {
  console.log('🚀 Building Autofy Extension...\n');

  try {
    // Read environment variables
    const envVars = readEnvFile();
    
    // Create build directory
    createBuildDir();
    
    // Copy files
    copyFiles();
    
    // Replace API key placeholder
    if (envVars) {
      replaceApiKey(envVars);
    }
    
    // Update version
    updateVersion();
    
    // Create build README
    createBuildReadme();
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📦 Extension ready in: ${BUILD_DIR}`);
    console.log('\n📋 Next steps:');
    console.log('1. Test the extension in Chrome');
    console.log('2. Package as .zip for distribution');
    console.log('3. Upload to Chrome Web Store (optional)');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Interactive build with prompts
 */
async function interactiveBuild() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Autofy Extension Builder\n');

  return new Promise((resolve) => {
    rl.question('Apakah Anda sudah mengatur .env file dengan API key Gemini? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        build().then(() => {
          rl.close();
          resolve();
        });
      } else {
        console.log('\n📝 Silakan ikuti langkah berikut:');
        console.log('1. Salin .env.example ke .env');
        console.log('2. Edit .env dan masukkan API key Gemini Anda');
        console.log('3. Jalankan build script lagi\n');
        rl.close();
        resolve();
      }
    });
  });
}

// Check if run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    interactiveBuild();
  } else {
    build();
  }
}

module.exports = { build, readEnvFile };
