// TabPulse - Main Popup Script
document.addEventListener('DOMContentLoaded', function() {
  console.log('TabPulse popup loaded ⚡');
  loadTabs();
  setupButtons();
});

// Main function to load and display all tabs
async function loadTabs() {
  try {
    showLoading();
    
    let tabs = await chrome.tabs.query({});
    
    console.log('Found ' + tabs.length + ' tabs');
    
    updateTabCount(tabs.length);
    displayTabs(tabs);
    
  } catch (error) {
    console.error('Error loading tabs:', error);
    showError('Failed to load tabs. Please try again.');
  }
}


function showLoading() {
  let tabListElement = document.getElementById('tabList');
  if (tabListElement) {
    tabListElement.innerHTML = '<div class="loading">Loading tabs...</div>';
  }
}

// Show error message
function showError(message) {
  let tabListElement = document.getElementById('tabList');
  if (tabListElement) {
    tabListElement.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">' + message + '</div></div>';
  }
}

// Update tab count display
function updateTabCount(count) {
  let tabCountElement = document.getElementById('tabCount');
  
  if (!tabCountElement) return;
  
  if (count === 0) {
    tabCountElement.textContent = 'No tabs open';
  } else if (count === 1) {
    tabCountElement.textContent = '1 tab open';
  } else {
    tabCountElement.textContent = count + ' tabs open';
  }
}

// Display tabs in the list
function displayTabs(tabs) {
  let tabListElement = document.getElementById('tabList');
  
  if (!tabListElement) {
    console.error('Tab list element not found');
    return;
  }
  
  tabListElement.innerHTML = '';
  
  if (tabs.length === 0) {
    tabListElement.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No tabs open</div></div>';
    return;
  }
  
  for (let i = 0; i < tabs.length; i++) {
    let tabElement = createTabElement(tabs[i]);
    tabListElement.appendChild(tabElement);
  }
  
  console.log('All tabs displayed successfully ⚡');
}

// Create individual tab element
function createTabElement(tab) {
  let tabItem = document.createElement('div');
  tabItem.className = 'tab-item';
  tabItem.dataset.tabId = tab.id;
  
  if (tab.active) {
    tabItem.classList.add('active');
  }
  
  let tabIcon = document.createElement('img');
  tabIcon.className = 'tab-icon';
  tabIcon.src = tab.favIconUrl || 'icons/icon16.png';
  tabIcon.alt = 'Tab icon';
  
  tabIcon.onerror = function() {
    this.src = 'icons/icon16.png';
  };
  
  let tabInfo = document.createElement('div');
  tabInfo.className = 'tab-info';
  
  let tabTitle = document.createElement('div');
  tabTitle.className = 'tab-title';
  tabTitle.textContent = tab.title || 'Untitled';
  tabTitle.title = tab.title;
  
  let tabUrl = document.createElement('div');
  tabUrl.className = 'tab-url';
  
  try {
    let url = new URL(tab.url);
    tabUrl.textContent = url.hostname;
  } catch (e) {
    tabUrl.textContent = tab.url;
  }
  tabUrl.title = tab.url;
  
  let closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.innerHTML = '×';
  closeBtn.title = 'Close tab';
  
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeTab(tab.id, tabItem);
  });
  
  tabInfo.appendChild(tabTitle);
  tabInfo.appendChild(tabUrl);
  
  tabItem.appendChild(tabIcon);
  tabItem.appendChild(tabInfo);
  tabItem.appendChild(closeBtn);
  
  tabInfo.addEventListener('click', function() {
    switchToTab(tab.id, tab.windowId);
  });
  
  return tabItem;
}

// Switch to a specific tab
async function switchToTab(tabId, windowId) {
  try {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
    console.log('Switched to tab ' + tabId + ' ⚡');
  } catch (error) {
    console.error('Error switching to tab:', error);
  }
}

// Close a specific tab with animation
async function closeTab(tabId, tabElement) {
  try {
    tabElement.classList.add('closing');
    
    await new Promise(function(resolve) {
      setTimeout(resolve, 300);
    });
    
    await chrome.tabs.remove(tabId);
    
    console.log('Tab ' + tabId + ' closed ⚡');
    
  } catch (error) {
    console.error('Error closing tab:', error);
    tabElement.classList.remove('closing');
  }
}

// Setup action buttons
function setupButtons() {
  let newTabBtn = document.getElementById('newTabBtn');
  if (newTabBtn) {
    newTabBtn.addEventListener('click', async function() {
      try {
        await chrome.tabs.create({
          active: true,
          url: 'chrome://newtab/'
        });
        console.log('New tab created ⚡');
      } catch (error) {
        console.error('Error creating new tab:', error);
      }
    });
  }
  
  let refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function() {
      try {
        let tabs = await chrome.tabs.query({});
        
        for (let i = 0; i < tabs.length; i++) {
          if (!tabs[i].url.startsWith('chrome://')) {
            await chrome.tabs.reload(tabs[i].id);
          }
        }
        
        console.log('Refreshed tabs ⚡');
      } catch (error) {
        console.error('Error refreshing tabs:', error);
      }
    });
  }
}

// Listen for tab updates
chrome.tabs.onCreated.addListener(function() {
  console.log('Tab created, refreshing...');
  loadTabs();
});

chrome.tabs.onRemoved.addListener(function() {
  console.log('Tab removed, refreshing...');
  loadTabs();
});

chrome.tabs.onUpdated.addListener(function() {
  loadTabs();
});

document.getElementById('newtabBtn').addEventListener('click',async()=>{
  try{
    await chrome.tabs.create({
      active:true,
      url: 'chrome://newtab/'
    });

    console.log('New tab created');

    // close popup(optional)
    //window.close();
  }catch(error){
    console.error('Error creating new tab:',error);
  }
});

// Refresh all tabs 

document.getElementById('refreshBtn').addEventListener('click',async()=>{
  try{
    const tabs = await chrome.tabs.query({});

    //refresh each tab
    for(const tab of tabs){
      //skip chrome:// URL(can't refresh those)
      if(!tab.url.startsWith('chrome://')){
        await chrome.tabs.reload(tab.id);
      }
    }
    console.log(`Refreshed ${tabs.length}tabs`);
  } catch(error){
    console.error('Error refreshing tabs:',error);

  }
});