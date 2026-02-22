
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
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started, TabPulse is active ⚡');
  
  // Initialize alarms on startup
  chrome.alarms.create('checkInactiveTabs', {
    periodInMinutes: 1
  });
  
  // Initialize tab tracking
  let tabs = await chrome.tabs.query({});
  let now = Date.now();
  
  for (let tab of tabs) {
    // Track all tabs
    tabLastActive[tab.id] = now;
    
    // Track empty tabs
    if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank' || !tab.url) {
      emptyTabTracker[tab.id] = {
        createdAt: now,
        isEmpty: true
      };
    }
  }
  
  console.log('All trackers initialized on startup ⚡');
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
  periodInMinutes: 0.5,
  periodInMinutes: 0.5

});


//// Track when tab is updated (clicked, navigated)

chrome.tabs.onUpdated.addListener(function(tabId,changeInfo){
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
    console.log('Alarm triggered: ' + new Date().toLocaleTimeString());
    await closeInactiveTabs();
    await closeEmptyNewTabs();
  }
});

// Main function to close inactive tabs

async function closeInactiveTabs(){
  try{
    //get settings
    let result = await chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime']);
    let enabled = result.autoCloseEnabled || false;
    let timeLimit = result.autoCloseTime || 20; //default 30 minutes
    
    if(!enabled){
      return;
    }

    let now = Date.now();
    let timeLimitMs  = timeLimit * 60 * 1000; // convert milliseconds
    
    //get all tabs
    let tabs = await chrome.tabs.query({});

    for(let tab of tabs){
      //Skip chrome:// URLs
      if(tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extention://')){
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

// Initialize on install
chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason === 'install'){
     // Set default settings
      chrome.storage.local.set({
      autoCloseEnabled: true,
      autoCloseTime: 20 ,
      autoCloseEmptyEnabled: true
    });
  }

});

// Auto-close empty new tabs feature
let emptyTabTracker = {}; // Track when empty tabs were created

// Track new tabs
chrome.tabs.onCreated.addListener(function(tab) {
  // Check if it's an empty new tab
  if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank' || !tab.url) {
    emptyTabTracker[tab.id] = {
      createdAt: Date.now(),
      isEmpty: true
    };
    console.log('Empty tab tracked:', tab.id);
  }
});

// Track when tab navigates away
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   // If tab navigated to actual URL, mark as not empty
//   if (changeInfo.url && changeInfo.url !== 'chrome://newtab/' && changeInfo.url !== 'about:blank') {
//     if (emptyTabTracker[tabId]) {
//       delete emptyTabTracker[tabId];
//       console.log('Tab no longer empty:', tabId);
//     }
//   }
// });

// Clean up closed tabs
chrome.tabs.onRemoved.addListener(function(tabId) {
  if (emptyTabTracker[tabId]) {
    delete emptyTabTracker[tabId];
  }
});

// Check empty tabs periodically (using existing alarm)
chrome.alarms.onAlarm.addListener(async function(alarm) {
  if (alarm.name === 'checkInactiveTabs') {
    await closeEmptyNewTabs();
  }
});

// Function to close empty new tabs
async function closeEmptyNewTabs() {
  try {
    // FIRST: Scan all current tabs and track any empty ones
    let allTabs = await chrome.tabs.query({});
    let now = Date.now();
    
    console.log('Scanning tabs for empty ones...');
    
    for (let tab of allTabs) {
      // Check if it's empty
      if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank' || !tab.url) {
        // If not tracked yet, add it
        if (!emptyTabTracker[tab.id]) {
          emptyTabTracker[tab.id] = {
            createdAt: now,
            isEmpty: true
          };
          console.log('Found and tracked empty tab:', tab.id);
        }
      } else {
        // If tracked but no longer empty, remove
        if (emptyTabTracker[tab.id]) {
          delete emptyTabTracker[tab.id];
          console.log('Tab no longer empty, untracked:', tab.id);
        }
      }
    }
    
    // Get setting
    let result = await chrome.storage.local.get(['autoCloseEmptyEnabled']);
    let enabled = result.autoCloseEmptyEnabled || false;
    
    if (!enabled) {
      return;
    }
    
    let timeLimit = 2 * 60 * 1000; // 2 minutes
    
    // Now close old empty tabs
    for (let tabId in emptyTabTracker) {
      let tabInfo = emptyTabTracker[tabId];
      let idleTime = now - tabInfo.createdAt;
      
      if (idleTime > timeLimit) {
        try {
          let tab = await chrome.tabs.get(parseInt(tabId));
          
          if (tab && (tab.url === 'chrome://newtab/' || tab.url === 'about:blank')) {
            console.log('Closing empty tab:', tabId, 'Idle for:', Math.floor(idleTime / 60000), 'minutes');
            
            await chrome.tabs.remove(parseInt(tabId));
            delete emptyTabTracker[tabId];
          }
        } catch (error) {
          delete emptyTabTracker[tabId];
        }
      }
    }
    
  } catch (error) {
    console.error('Error closing empty tabs:', error);
  }
}




