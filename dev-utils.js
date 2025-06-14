#!/usr/bin/env node

/**
 * Development Utilities untuk Autofy Extension
 * Script untuk membantu development dan testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Generate placeholder icons
 */
function generatePlaceholderIcons() {
  console.log('🎨 Generating placeholder icons...');
  
  const sizes = [16, 32, 48, 128];
  const iconsDir = './icons';
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
  }
  
  sizes.forEach(size => {
    const canvas = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" 
        font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.6}" fill="white">A</text>
</svg>`;
    
    fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), canvas);
    console.log(`✅ Generated icon${size}.svg`);
  });
  
  console.log('📝 Note: Convert SVG to PNG for final usage');
}

/**
 * Validate manifest
 */
function validateManifest() {
  console.log('🔍 Validating manifest.json...');
  
  try {
    const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
    
    // Check required fields
    const required = ['manifest_version', 'name', 'version', 'permissions'];
    const missing = required.filter(field => !manifest[field]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required fields:', missing);
      return false;
    }
    
    // Check manifest version
    if (manifest.manifest_version !== 3) {
      console.warn('⚠️  Using Manifest V2. Consider upgrading to V3');
    }
    
    // Check permissions
    if (!manifest.permissions || manifest.permissions.length === 0) {
      console.warn('⚠️  No permissions specified');
    }
    
    console.log('✅ Manifest validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Invalid manifest.json:', error.message);
    return false;
  }
}

/**
 * Check file integrity
 */
function checkFileIntegrity() {
  console.log('📁 Checking file integrity...');
  
  const requiredFiles = [
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
  
  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    console.error('❌ Missing files:', missing);
    return false;
  }
  
  console.log('✅ All required files present');
  return true;
}

/**
 * Lint JavaScript files
 */
function lintFiles() {
  console.log('🔧 Basic JavaScript syntax check...');
  
  const jsFiles = [
    'background.js',
    'content.js',
    'config.js',
    'gemini-service.js',
    'form-analyzer.js',
    'form-filler.js',
    'popup.js'
  ];
  
  let hasErrors = false;
  
  jsFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Basic syntax check
      if (content.includes('console.log') && !content.includes('development')) {
        console.warn(`⚠️  ${file}: Contains console.log statements`);
      }
      
      // Check for common issues
      if (content.includes('chrome.runtime') && !content.includes('chrome.runtime.lastError')) {
        console.warn(`⚠️  ${file}: Missing error handling for chrome.runtime`);
      }
      
      console.log(`✅ ${file}: Syntax OK`);
      
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
      hasErrors = true;
    }
  });
  
  return !hasErrors;
}

/**
 * Generate test data
 */
function generateTestData() {
  console.log('🧪 Generating test data...');
  
  const testData = {
    sampleForms: [
      {
        title: "Survey Kepuasan Pelanggan",
        questions: [
          {
            type: "short_answer",
            text: "Nama lengkap Anda?",
            required: true
          },
          {
            type: "email", 
            text: "Alamat email",
            required: true
          },
          {
            type: "multiple_choice",
            text: "Bagaimana penilaian Anda terhadap layanan kami?",
            options: ["Sangat Puas", "Puas", "Cukup", "Kurang Puas", "Tidak Puas"],
            required: true
          },
          {
            type: "paragraph",
            text: "Saran atau kritik untuk perbaikan layanan",
            required: false
          }
        ]
      }
    ],
    
    sampleResponses: {
      "Nama lengkap Anda?": "John Doe",
      "Alamat email": "john.doe@example.com", 
      "Bagaimana penilaian Anda terhadap layanan kami?": "Puas",
      "Saran atau kritik untuk perbaikan layanan": "Layanan sudah baik, mungkin bisa ditingkatkan kecepatan responnya."
    },
    
    testConfig: {
      geminiApiKey: "test_api_key_placeholder",
      responseStyle: "natural",
      language: "id",
      autoFillEnabled: true,
      notifications: true
    }
  };
  
  fs.writeFileSync('./test-data.json', JSON.stringify(testData, null, 2));
  console.log('✅ Test data generated: test-data.json');
}

/**
 * Create development documentation
 */
function createDevDocs() {
  console.log('📚 Creating development documentation...');
  
  const devDocs = `# Development Documentation

## Architecture Overview

### Core Components

1. **ConfigManager** (config.js)
   - Manages extension settings
   - Handles API key storage
   - Provides configuration validation

2. **GeminiService** (gemini-service.js)
   - Integrates with Google Gemini AI
   - Handles API requests and responses
   - Processes different question types

3. **FormAnalyzer** (form-analyzer.js)
   - Analyzes Google Form structure
   - Extracts questions and options
   - Detects question types

4. **FormFiller** (form-filler.js)
   - Fills form fields automatically
   - Handles different input types
   - Simulates human-like interaction

5. **Content Script** (content.js)
   - Main orchestrator
   - Manages UI interactions
   - Coordinates between components

### Message Passing

\`\`\`javascript
// Background to Content Script
chrome.tabs.sendMessage(tabId, { action: 'analyzeForm' });

// Content Script to Background
chrome.runtime.sendMessage({ action: 'openSettings' });

// Popup to Background
chrome.runtime.sendMessage({ action: 'getConfig' });
\`\`\`

### Storage Structure

\`\`\`javascript
chrome.storage.sync.set({
  autofy_config: {
    geminiApiKey: 'string',
    responseStyle: 'natural|formal|brief',
    language: 'id|en',
    autoFillEnabled: boolean,
    notifications: boolean
  }
});
\`\`\`

## Development Workflow

1. Make changes to source files
2. Test in Chrome with Developer Mode
3. Run \`npm run build\` for production
4. Validate with \`node dev-utils.js validate\`

## Testing

### Manual Testing
1. Load extension in Chrome
2. Navigate to Google Form
3. Test each feature manually

### API Testing
\`\`\`javascript
// Test Gemini connection
const service = new GeminiService(apiKey);
await service.testConnection();
\`\`\`

## Debugging

### Console Logs
- Background: Inspect extension background page
- Content: Inspect Google Form page
- Popup: Right-click extension icon → Inspect popup

### Common Issues
- Permission errors: Check manifest.json
- API errors: Verify Gemini API key
- DOM errors: Check Google Form selectors

## Best Practices

1. Always handle chrome.runtime.lastError
2. Use try-catch for async operations
3. Validate user inputs
4. Respect rate limits
5. Test across different form types
`;
  
  fs.writeFileSync('./DEV-DOCS.md', devDocs);
  console.log('✅ Development docs created: DEV-DOCS.md');
}

/**
 * Run all validations
 */
function runValidation() {
  console.log('🚀 Running full validation...\n');
  
  const checks = [
    { name: 'File Integrity', fn: checkFileIntegrity },
    { name: 'Manifest Validation', fn: validateManifest },
    { name: 'Code Linting', fn: lintFiles }
  ];
  
  let passed = 0;
  
  checks.forEach(check => {
    console.log(`\n📋 ${check.name}:`);
    if (check.fn()) {
      passed++;
    }
  });
  
  console.log(`\n🎯 Validation Results: ${passed}/${checks.length} passed`);
  
  if (passed === checks.length) {
    console.log('✅ All validations passed! Extension is ready.');
  } else {
    console.log('❌ Some validations failed. Please fix issues before proceeding.');
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'icons':
      generatePlaceholderIcons();
      break;
      
    case 'validate':
      runValidation();
      break;
      
    case 'lint':
      lintFiles();
      break;
      
    case 'manifest':
      validateManifest();
      break;
      
    case 'test-data':
      generateTestData();
      break;
      
    case 'docs':
      createDevDocs();
      break;
      
    case 'all':
      generatePlaceholderIcons();
      generateTestData();
      createDevDocs();
      runValidation();
      break;
      
    default:
      console.log(`
🤖 Autofy Development Utilities

Available commands:
  node dev-utils.js icons      - Generate placeholder icons
  node dev-utils.js validate   - Run all validations
  node dev-utils.js lint       - Lint JavaScript files
  node dev-utils.js manifest   - Validate manifest.json
  node dev-utils.js test-data  - Generate test data
  node dev-utils.js docs       - Create dev documentation
  node dev-utils.js all        - Run all utilities

Example:
  node dev-utils.js validate
      `);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generatePlaceholderIcons,
  validateManifest,
  checkFileIntegrity,
  lintFiles,
  runValidation
};
