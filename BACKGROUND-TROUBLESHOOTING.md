# 🛠️ Background Script & Service Worker Troubleshooting Guide

## Overview
This guide helps fix common background script and service worker issues in the Autofy Chrome Extension.

## 🔧 Issues Fixed

### 1. **Service Worker Registration Failed (Status Code: 15)**
**Problem**: Chrome extension service worker fails to register properly.

**Solution**: 
- Added missing permissions in manifest.json
- Fixed API availability checks in background.js
- Added proper error handling for Chrome APIs

### 2. **Cannot read properties of undefined (reading 'onClicked')**
**Problem**: `chrome.notifications.onClicked` is undefined when notifications permission is missing.

**Solution**: 
- Added "notifications" permission to manifest.json
- Added API availability checks before using notification APIs
- Created safe wrapper functions for notification operations

### 3. **Context Menu API Errors**
**Problem**: Context menu APIs failing without proper permissions.

**Solution**: 
- Added "contextMenus" permission to manifest.json
- Added API availability checks for context menu operations

## 📋 Permissions Added

Updated `manifest.json` with required permissions:
```json
"permissions": [
  "activeTab",
  "storage", 
  "scripting",
  "notifications",    // Added for notifications
  "contextMenus"      // Added for context menus
]
```

## 🛡️ API Protection Patterns

### Safe Notification Creation
```javascript
function createNotification(options) {
  if (chrome.notifications && chrome.notifications.create) {
    return chrome.notifications.create(options);
  } else {
    console.warn('chrome.notifications.create API not available');
    return Promise.resolve();
  }
}
```

### Safe Notification Event Listeners
```javascript
if (chrome.notifications && chrome.notifications.onClicked) {
  chrome.notifications.onClicked.addListener((notificationId) => {
    clearNotification(notificationId);
  });
} else {
  console.warn('chrome.notifications API not available');
}
```

### Safe Context Menu Setup
```javascript
if (chrome.contextMenus && chrome.contextMenus.create) {
  chrome.contextMenus.create({
    id: 'autofy-analyze',
    title: 'Analisis form dengan Autofy',
    contexts: ['page'],
    documentUrlPatterns: ['*://docs.google.com/forms/*']
  });
} else {
  console.warn('chrome.contextMenus API not available');
}
```

## 🧪 Testing Tools

### 1. **Background Script Syntax Test**
Run `test-background.html` to validate background script syntax:
- Checks for JavaScript syntax errors
- Validates API calls with mocked Chrome APIs
- Reports any issues found

### 2. **Extension Reload Process**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Reload" on Autofy extension
4. Check console for any errors

### 3. **Service Worker Inspection**
1. Go to `chrome://extensions/`
2. Click "Inspect views: service worker" for Autofy
3. Check console for initialization messages
4. Look for "🤖 Autofy background script loaded"

## 🔍 Common Error Patterns

### Error: "Service worker registration failed"
**Cause**: Missing permissions or syntax errors in background.js
**Fix**: 
- Check manifest.json permissions
- Validate background.js syntax
- Use test-background.html for validation

### Error: "Cannot read properties of undefined"
**Cause**: Trying to access Chrome API without proper permission
**Fix**: 
- Add required permission to manifest.json
- Add API availability check before usage

### Error: "Extension context invalidated"
**Cause**: Service worker restarted or extension reloaded
**Fix**: 
- Add service worker keep-alive mechanism
- Handle context invalidation gracefully

## 📊 Validation Checklist

- [ ] All required permissions in manifest.json
- [ ] API availability checks before Chrome API usage
- [ ] Proper error handling in background script
- [ ] Service worker keep-alive mechanism
- [ ] Context menu setup with error handling
- [ ] Notification API with fallback handling
- [ ] Background script syntax validation

## 🚀 Post-Fix Verification

1. **Load Extension**: Extension loads without errors
2. **Service Worker**: Shows "🤖 Autofy background script loaded" in console
3. **Notifications**: Welcome notification appears on install
4. **Context Menus**: Right-click menus appear on Google Forms
5. **API Calls**: All Chrome APIs work without undefined errors

## 🔧 If Issues Persist

1. **Check Chrome Version**: Ensure using Chrome 88+ for Manifest V3
2. **Clear Extension Data**: Remove and reinstall extension
3. **Inspect Service Worker**: Use Chrome DevTools to debug
4. **Test in Incognito**: Rule out conflicting extensions
5. **Review Console Logs**: Check for specific error patterns

## 📝 Files Modified

- `manifest.json` - Added notifications and contextMenus permissions
- `background.js` - Added API availability checks and safe wrappers
- `test-background.html` - Background script syntax validation tool

The background script should now work reliably without API errors or service worker registration failures.
