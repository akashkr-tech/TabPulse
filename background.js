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


let tabLastActive = {};

chrome.alarms.create('checkInactiveTabs',{
  periodInMinutes: 1 
});


//// Track when tab is updated (clicked, navigated)

chrome.tabs.onUpdate.addListener(function(tabId,changeInfo){
  if(changeInfo.status === 'complete' || changeInfo.url){
    tabLastActive[tabId] = Date.now();
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(function(tabId){
  delete tabLastActive[tabId];
});

// Check for inactive tabs periodically
chrome.alarms.onAlarm.addListener(async function(alarm){
  if(alarm.name === 'checkInactiveTabs'){
    await closeInactiveTabs();
  }
});

// Main function to close inactive tabs

async function closeInactiveTabs(){
  try{
    //get settings
    let result = await chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime']);
    let enabled = result.autoCloseEnabled || false;
    let timeLimit = result.autoCloseTime || 30; //default 30 minutes
    
    if(!enabled){
      return;
    }

    let now = Date.now();
    let timeLimitMs  = timeLimit * 60 * 1000; // convert milliseconds
    
    //get all tabs
    let tabs = await chrome.tabs.query({});

    for(let tab of tabs){
      //Skip chrome:// URLs
      if(tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extention')){
        continue;
      }

      //Skip tab active
      if(tab.active){
        continue;
      }
      // Skip tabs with audio
      if(tab.audible){
        continue;
      }

      //check last active time
      let lastActive = tabLastActive[tab.id];

      if(!lastActive){
        // First time seeing this tab, mark it
        tabLastActive[tab.id] = now;
        continue;
      }

      let inactiveTime = now - lastActive;

      // Close if inactive for longer than limit
      if(inactiveTime > timeLimitMs){
        console.log('closing inactive tab:' , tab.title, 'Inactive for:' , Math.floor(inactiveTime / 60000), 'minutes');

        await chrome.tabs.remove(tab.id);
        delete tabLastActive[tab.id];
      }
    }

  }catch(error){
    console.error('Error checking inactive tabs:' , error);
  
  }
}

// Initialize tracking for existing tabs on startup
chrome.runtime.onStartup.addListener(async function(){
  let tabs = await chrome.tabs.query({});
  let now = Date.now();

  for(let tab of tabs){
    tabLastActive[tab.id] = now;
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason === 'install'){
     // Set default settings
      chrome.storage.local.set({
      autoCloseEnabled: false,
      autoCloseTime: 30 
    });
  }
})