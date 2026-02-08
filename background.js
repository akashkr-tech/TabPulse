// TabPulse - Background Service Worker
// This runs in the background and handles extension lifecycle events

console.log('TabPulse background service worker starting... ⚡');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('TabPulse installed successfully! ⚡');
    
    // Set default settings on first install
    chrome.storage.local.set({
      version: '1.0.0',
      installedDate: new Date().toISOString(),
      autoSuspendEnabled: false,
      autoSuspendTime: 30, // minutes
      analyticsEnabled: true,
      theme: 'default',
      focusModeEnabled: false
    });
    
    // Optional: Open welcome page
    // chrome.tabs.create({ url: 'welcome.html' });
    
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;
    console.log(`TabPulse updated from ${previousVersion} to ${currentVersion} ⚡`);
  }
});

// Listen for browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started, TabPulse is active ');
});

// Log when service worker is activated
console.log('TabPulse background service worker ready ');

