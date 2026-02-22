// TabPulse - Main Popup Script
document.addEventListener('DOMContentLoaded', function() {
  console.log('TabPulse popup loaded ⚡');
  loadTabs();
  setupButtons();
  setupSearch();
  setupSessionButtons();
  loadSessions();
  updateDailyStats(); 
  setupSettings();
  setTimeout(function() {
    loadSettings();
  }, 100);
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

// Show loading state
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

  let groupByDomainBtn = document.getElementById('groupByDomainBtn');
  if (groupByDomainBtn) {
    groupByDomainBtn.addEventListener('click', async function() {
      try {
        await groupTabsByDomain();
        console.log('Tabs grouped by domain ⚡');
      } catch (error) {
        console.error('Error grouping tabs:', error);
      }
    });
  }
}

// Search functionality
function setupSearch() {
  let searchInput = document.getElementById('searchInput');
  let clearSearchBtn = document.getElementById('clearSearchBtn');
  
  if (!searchInput || !clearSearchBtn) {
    console.log('Search elements not found');
    return;
  }
  
  // Search input event
  searchInput.addEventListener('input', function(e) {
    let searchTerm = e.target.value.toLowerCase().trim();
    
    // Show/hide clear button
    if (searchTerm.length > 0) {
      clearSearchBtn.style.display = 'flex';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    
    // Filter tabs
    filterTabs(searchTerm);
  });
  
  // Clear search button event
  clearSearchBtn.addEventListener('click', function() {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    filterTabs('');
    searchInput.focus();
  });
  
  // Keyboard shortcut - Ctrl+F to focus search
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

// Filter tabs based on search term
function filterTabs(searchTerm) {
  let tabItems = document.querySelectorAll('.tab-item');
  let visibleCount = 0;
  
  tabItems.forEach(function(tabItem) {
    let titleElement = tabItem.querySelector('.tab-title');
    let urlElement = tabItem.querySelector('.tab-url');
    
    if (!titleElement || !urlElement) return;
    
    let title = titleElement.textContent.toLowerCase();
    let url = urlElement.textContent.toLowerCase();
    
    // Check if search term matches title or URL
    if (searchTerm === '' || title.includes(searchTerm) || url.includes(searchTerm)) {
      tabItem.classList.remove('hidden');
      visibleCount++;
    } else {
      tabItem.classList.add('hidden');
    }
  });
  
  // Show "no results" message if needed
  let tabListElement = document.getElementById('tabList');
  let noResultsMsg = document.querySelector('.no-results');
  
  if (visibleCount === 0 && searchTerm !== '') {
    if (!noResultsMsg) {
      let noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = '<div class="no-results-icon">🔍</div><div class="no-results-text">No tabs found for "' + searchTerm + '"</div>';
      tabListElement.appendChild(noResults);
    }
  } else {
    if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }
  
  // Update tab count to show filtered results
  updateSearchCount(visibleCount, tabItems.length, searchTerm);
}

// Update tab count during search
function updateSearchCount(visibleCount, totalCount, searchTerm) {
  let tabCountElement = document.getElementById('tabCount');
  
  if (!tabCountElement) return;
  
  if (searchTerm === '') {
    // Normal count
    if (totalCount === 0) {
      tabCountElement.textContent = 'No tabs open';
    } else if (totalCount === 1) {
      tabCountElement.textContent = '1 tab open';
    } else {
      tabCountElement.textContent = totalCount + ' tabs open';
    }
  } else {
    // Search results count
    tabCountElement.textContent = visibleCount + ' of ' + totalCount + ' tabs';
  }
}

// Listen for tab updates
// chrome.tabs.onCreated.addListener(function() {
//   console.log('Tab created, refreshing...');
//   trackTabOpened();
//   loadTabs();
// });

// chrome.tabs.onRemoved.addListener(function() {
//   console.log('Tab removed, refreshing...');
//   trackTabClosed();
//   loadTabs();
// });

chrome.tabs.onUpdated.addListener(function() {
  loadTabs();
});

// Group tabs by domain
async function groupTabsByDomain() {
  try {
    // Get all tabs in current window
    let tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Create a map to store tabs by domain
    let domainMap = {};
    
    // Group tabs by their domain
    for (let i = 0; i < tabs.length; i++) {
      let tab = tabs[i];
      
      // Skip chrome:// and extension URLs
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        continue;
      }
      
      try {
        let url = new URL(tab.url);
        let domain = url.hostname;
        
        // Remove 'www.' from domain
        domain = domain.replace('www.', '');
        
        // Initialize array for this domain if not exists
        if (!domainMap[domain]) {
          domainMap[domain] = [];
        }
        
        domainMap[domain].push(tab.id);
        
      } catch (e) {
        console.log('Could not parse URL:', tab.url);
      }
    }
    
    // Colors for grouping
    let colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    let colorIndex = 0;
    
    // Create groups for each domain
    for (let domain in domainMap) {
      let tabIds = domainMap[domain];
      
      // Only create group if there are multiple tabs from same domain
      if (tabIds.length > 1) {
        // Create the group
        let groupId = await chrome.tabs.group({ tabIds: tabIds });
        
        // Set group title and color
        await chrome.tabGroups.update(groupId, {
          title: domain + ' (' + tabIds.length + ')',
          color: colors[colorIndex % colors.length]
        });
        
        colorIndex++;
      }
    }
    
    // Refresh the popup to show updated state
    setTimeout(function() {
      loadTabs();
    }, 500);
    
  } catch (error) {
    console.error('Error in groupTabsByDomain:', error);
  }
}

// Save current session
async function saveSession() {
  try {
    // Get current tabs
    let tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Filter out chrome:// URLs
    let validTabs = tabs.filter(function(tab) {
      return !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://');
    });
    
    if (validTabs.length === 0) {
      alert('No valid tabs to save!');
      return;
    }
    
    // Ask for session name
    let sessionName = prompt('Enter session name:', 'My Session');
    
    if (!sessionName) {
      return; // User cancelled
    }
    
    // Create session object
    let session = {
      name: sessionName.trim(),
      timestamp: new Date().toISOString(),
      tabs: validTabs.map(function(tab) {
        return {
          url: tab.url,
          title: tab.title
        };
      })
    };
    
    // Get existing sessions
    let result = await chrome.storage.local.get(['sessions']);
    let sessions = result.sessions || [];
    
    // Add new session
    sessions.push(session);
    
    // Save to storage
    await chrome.storage.local.set({ sessions: sessions });
    
    console.log('Session saved: ' + sessionName + ' (' + validTabs.length + ' tabs) ⚡');
    
    // Update UI
    loadSessions();
    
  } catch (error) {
    console.error('Error saving session:', error);
    alert('Failed to save session');
  }
}

// Load and display saved sessions
async function loadSessions() {
  try {
    let result = await chrome.storage.local.get(['sessions']);
    let sessions = result.sessions || [];
    
    let sessionsList = document.getElementById('sessionsList');
    
    if (!sessionsList) return;
    
    // Clear current list
    sessionsList.innerHTML = '';
    
    if (sessions.length === 0) {
      sessionsList.innerHTML = '<div class="sessions-empty">No saved sessions</div>';
      return;
    }
    
    // Display each session
    sessions.forEach(function(session, index) {
      let sessionItem = createSessionElement(session, index);
      sessionsList.appendChild(sessionItem);
    });
    
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
}

// Create session element
function createSessionElement(session, index) {
  let sessionItem = document.createElement('div');
  sessionItem.className = 'session-item';
  
  // Format timestamp
  let date = new Date(session.timestamp);
  let formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Session info
  let sessionInfo = document.createElement('div');
  sessionInfo.className = 'session-info';
  
  let sessionName = document.createElement('div');
  sessionName.className = 'session-name';
  sessionName.textContent = session.name;
  
  let sessionMeta = document.createElement('div');
  sessionMeta.className = 'session-meta';
  sessionMeta.textContent = session.tabs.length + ' tabs • ' + formattedDate;
  
  sessionInfo.appendChild(sessionName);
  sessionInfo.appendChild(sessionMeta);
  
  // Action buttons
  let sessionActions = document.createElement('div');
  sessionActions.className = 'session-actions';
  
  let restoreBtn = document.createElement('button');
  restoreBtn.className = 'session-btn restore-btn';
  restoreBtn.textContent = 'Restore';
  restoreBtn.addEventListener('click', function() {
    restoreSession(index);
  });
  
  let deleteBtn = document.createElement('button');
  deleteBtn.className = 'session-btn delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function() {
    deleteSession(index);
  });
  
  sessionActions.appendChild(restoreBtn);
  sessionActions.appendChild(deleteBtn);
  
  sessionItem.appendChild(sessionInfo);
  sessionItem.appendChild(sessionActions);
  
  return sessionItem;
}

// Restore a saved session
async function restoreSession(index) {
  try {
    let result = await chrome.storage.local.get(['sessions']);
    let sessions = result.sessions || [];
    
    if (!sessions[index]) {
      alert('Session not found');
      return;
    }
    
    let session = sessions[index];
    
    // Confirm before opening multiple tabs
    let confirmed = confirm('Open ' + session.tabs.length + ' tabs from "' + session.name + '"?');
    
    if (!confirmed) {
      return;
    }
    
    // Open all tabs
    for (let i = 0; i < session.tabs.length; i++) {
      await chrome.tabs.create({
        url: session.tabs[i].url,
        active: i === 0 // First tab active, rest in background
      });
    }
    
    console.log('Session restored: ' + session.name + ' ⚡');
    
  } catch (error) {
    console.error('Error restoring session:', error);
    alert('Failed to restore session');
  }
}

// Delete a saved session
async function deleteSession(index) {
  try {
    let result = await chrome.storage.local.get(['sessions']);
    let sessions = result.sessions || [];
    
    if (!sessions[index]) {
      return;
    }
    
    let sessionName = sessions[index].name;
    
    // Confirm deletion
    let confirmed = confirm('Delete session "' + sessionName + '"?');
    
    if (!confirmed) {
      return;
    }
    
    // Remove from array
    sessions.splice(index, 1);
    
    // Save updated sessions
    await chrome.storage.local.set({ sessions: sessions });
    
    console.log('Session deleted: ' + sessionName + ' ⚡');
    
    // Update UI
    loadSessions();
    
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

// Setup session buttons
function setupSessionButtons() {
  let saveSessionBtn = document.getElementById('saveSessionBtn');
  
  if (saveSessionBtn) {
    saveSessionBtn.addEventListener('click', function() {
      saveSession();
    });
  }
}

async function updateDailyStats(){
  try{
    let today = new Date().toISOString().split('T')[0];

    //get stats from storage

    let result = await chrome.storage.local.get(['dailyStats']);
    let stats = result.dailyStats || {};

    //initalized today's stats if not exist
    if(!stats[today]){
      stats[today] = {
        date:today,
        tabsOpened:0,
        tabsClosed:0
      };
      await chrome.storage.local.set({dailyStats:stats});
    }

    //update badge
    let todayBadge = document.getElementById('todayBadge');
    if(todayBadge){
      todayBadge.textContent = ' Today: ' + stats[today].tabsOpened;
    }

    console.log('daily stats updated:',stats[today]);

  }catch(error){
    console.error('Error updating daily stats:',error);

  }
}

//track tab opened
async function trackTabOpened(){
  try{
    let today = new Date().toISOString().split('T')[0];

    let result = await chrome.storage.local.get(['dailyStats']);
    let stats = result.dailyStats || {};

    if(!stats[today]){
      stats[today]={
        date:today,
        tabsOpened:0,
        tabsClosed:0
      };
    }

    stats[today].tabsOpened++;

    await chrome.storage.local.set({dailyStats:stats});

    //update badge 
    updateDailyStats();
  }catch(error){
    console.error('Error tracking yab opened:' , error);

  }
}

//track tab closed
async function trackTabClosed(){
  try{
    let today = new Date().toISOString().split('T')[0];

    let result = await chrome.storage.local.get(['dailyStats']);
    let stats =  result.dailyStats || {};

    if(!stats[today]){
      stats[today] ={
        date:today,
        tabsOpened:0,
        tabsClosed:0
      };
    }

    stats[today].tabsClosed++;

    await chrome.storage.local.set({dailyStats:stats});

  }catch(error){
    console.error('Error tracking tab closed' , error);

  }
}

// Setup settings
function setupSettings() {
  // Toggle collapse
  let settingsToggle = document.getElementById('settingsToggle');
  let settingsContent = document.getElementById('settingsContent');
  
  if (settingsToggle) {
    settingsToggle.addEventListener('click', function() {
      settingsContent.classList.toggle('hidden');
      settingsToggle.classList.toggle('collapsed');
    });
  }
  
  // Auto-close toggle
  let autoCloseToggle = document.getElementById('autoCloseToggle');
  let timeContainer = document.getElementById('autoCloseTimeContainer');
  
  if (autoCloseToggle) {
    autoCloseToggle.addEventListener('change', async function() {
      let enabled = this.checked;
      
      await chrome.storage.local.set({ autoCloseEnabled: enabled });
      
      // Show/hide time selector
      if (timeContainer) {
        timeContainer.style.display = enabled ? 'flex' : 'none';
      }
      
      console.log('Auto-close ' + (enabled ? 'enabled' : 'disabled'));
    });
  }
  
  // Time select
  let timeSelect = document.getElementById('autoCloseTimeSelect');
  
  if (timeSelect) {
    timeSelect.addEventListener('change', async function() {
      let time = parseInt(this.value);
      
      await chrome.storage.local.set({ autoCloseTime: time });
      
      console.log('Auto-close time set to ' + time + ' minutes');
    });
  }
}


// Auto-close empty tabs toggle
let autoCloseEmptyToggle = document.getElementById('autoCloseEmptyToggle');

if (autoCloseEmptyToggle) {
  autoCloseEmptyToggle.addEventListener('change', async function() {
    let enabled = this.checked;
    
    await chrome.storage.local.set({ autoCloseEmptyEnabled: enabled });
    
    console.log('Auto-close empty tabs ' + (enabled ? 'enabled' : 'disabled'));
  });
}

// Load settings from storage
async function loadSettings() {
  try {
    let result = await chrome.storage.local.get(['autoCloseEnabled', 'autoCloseTime','autoCloseEmptyEnabled']);
    
    let enabled = result.autoCloseEnabled || false;
    let time = result.autoCloseTime || 20;
    let emptyEnabled = result.autoCloseEmptyEnabled || false;
    
    // Set toggle
    let autoCloseToggle = document.getElementById('autoCloseToggle');
    if (autoCloseToggle) {
      autoCloseToggle.checked = enabled;
    }
    
    // Set time select
    let timeSelect = document.getElementById('autoCloseTimeSelect');
    if (timeSelect) {
      timeSelect.value = time;
    }
    
    // Show/hide time container
    let timeContainer = document.getElementById('autoCloseTimeContainer');
    if (timeContainer) {
      timeContainer.style.display = enabled ? 'flex' : 'none';
    }

     // Set empty tab toggle
    let autoCloseEmptyToggle = document.getElementById('autoCloseEmptyToggle');
    if (autoCloseEmptyToggle) {
      autoCloseEmptyToggle.checked = emptyEnabled;
    }
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}