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

// Track tab opened
chrome.tabs.onCreated.addListener(async function() {
  console.log('Tab created in background ⚡');
  
  try {
    let today = new Date().toISOString().split('T')[0];
    
    let result = await chrome.storage.local.get(['dailyStats']);
    let stats = result.dailyStats || {};
    
    if (!stats[today]) {
      stats[today] = {
        date: today,
        tabsOpened: 0,
        tabsClosed: 0
      };
    }
    
    stats[today].tabsOpened++;
    
    await chrome.storage.local.set({ dailyStats: stats });
    
    console.log('Stats updated:', stats[today].tabsOpened);
    
  } catch (error) {
    console.error('Error tracking tab:', error);
  }
});

// Track tab closed
chrome.tabs.onRemoved.addListener(async function() {
  console.log('Tab closed in background ⚡');
  
  try {
    let today = new Date().toISOString().split('T')[0];
    
    let result = await chrome.storage.local.get(['dailyStats']);
    let stats = result.dailyStats || {};
    
    if (!stats[today]) {
      stats[today] = {
        date: today,
        tabsOpened: 0,
        tabsClosed: 0
      };
    }
    
    stats[today].tabsClosed++;
    
    await chrome.storage.local.set({ dailyStats: stats });
    
  } catch (error) {
    console.error('Error tracking tab close:', error);
  }
});