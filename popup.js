// TabPulse - Main Popup Script
// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
  console.log('TabPulse popup loaded ⚡');
  loadTabs();
});

// Main function to load and display all tabs
async function loadTabs() {
  try {
    // Show loading state
    showLoading();
    
    // Get all tabs from all windows
    const tabs = await chrome.tabs.query({});
    
    console.log(`Found ${tabs.length} tabs`);
    
    // Update tab count display
    updateTabCount(tabs.length);
    
    // Display tabs in the list
    displayTabs(tabs);
    
  } catch (error) {
    console.error('Error loading tabs:', error);
    showError('Failed to load tabs. Please try again.');
  }
}

// Show loading state
function showLoading() {
  const tabListElement = document.getElementById('tabList');
  tabListElement.innerHTML = '<div class="loading">Loading tabs...</div>';
}

// Show error message
function showError(message) {
  const tabListElement = document.getElementById('tabList');
  tabListElement.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">${message}</div>
    </div>
  `;
}

// Update tab count display
function updateTabCount(count) {
  const tabCountElement = document.getElementById('tabCount');
  
  if (count === 0) {
    tabCountElement.textContent = 'No tabs open';
  } else if (count === 1) {
    tabCountElement.textContent = '1 tab open';
  } else {
    tabCountElement.textContent = `${count} tabs open`;
  }
}

// Display tabs in the list
function displayTabs(tabs) {
  const tabListElement = document.getElementById('tabList');
  
  // Clear existing content
  tabListElement.innerHTML = '';
  
  // If no tabs, show empty state
  if (tabs.length === 0) {
    tabListElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No tabs open</div>
      </div>
    `;
    return;
  }
  
  // Create and append each tab element
  tabs.forEach(tab => {
    const tabElement = createTabElement(tab);
    tabListElement.appendChild(tabElement);
  });
  
  console.log('All tabs displayed successfully ⚡');
}

// Create individual tab element
function createTabElement(tab) {
  // Create main container
  const tabItem = document.createElement('div');
  tabItem.className = 'tab-item';
  
  // Add active class if this is the current tab
  if (tab.active) {
    tabItem.classList.add('active');
  }
  
  // Create tab icon (favicon)
  const tabIcon = document.createElement('img');
  tabIcon.className = 'tab-icon';
  tabIcon.src = tab.favIconUrl || 'icons/icon16.png';
  tabIcon.alt = 'Tab icon';
  
  // Fallback if favicon fails to load
  tabIcon.onerror = function() {
    this.src = 'icons/icon16.png';
  };
  
  // Create tab info container
  const tabInfo = document.createElement('div');
  tabInfo.className = 'tab-info';

   const tabTitle = document.createElement('div');
  tabTitle.className = 'tab-title';
  tabTitle.textContent = tab.title || 'Untitled';
  tabTitle.title = tab.title; // Tooltip for full title
  
  // Create tab URL
  const tabUrl = document.createElement('div');
  tabUrl.className = 'tab-url';
  
  // Extract hostname from URL
  try {
    const url = new URL(tab.url);
    tabUrl.textContent = url.hostname;
  } catch (e) {
    // If URL parsing fails, show the full URL
    tabUrl.textContent = tab.url;
  }
  tabUrl.title = tab.url; // Tooltip for full URL
  
  // Append title and URL to info container
  tabInfo.appendChild(tabTitle);
  tabInfo.appendChild(tabUrl);
  
  // Append icon and info to main container
  tabItem.appendChild(tabIcon);
  tabItem.appendChild(tabInfo);

   // Add click event listener to switch to this tab
  tabItem.addEventListener('click', () => {
    switchToTab(tab.id, tab.windowId);
  });
  
  return tabItem;
}

// Switch to a specific tab
async function switchToTab(tabId, windowId) {
  try {
    // Activate the tab
    await chrome.tabs.update(tabId, { active: true });
    
    // Focus the window containing the tab
    await chrome.windows.update(windowId, { focused: true });
    
    console.log(`Switched to tab ${tabId} ⚡`);
    
  } catch (error) {
    console.error('Error switching to tab:', error);
  }
}

// Listen for tab updates to refresh the list
chrome.tabs.onCreated.addListener(() => {
  console.log('New tab created, refreshing list...');
  loadTabs();
});

chrome.tabs.onRemoved.addListener(() => {
  console.log('Tab removed, refreshing list...');
  loadTabs();
});

chrome.tabs.onUpdated.addListener(() => {
  console.log('Tab updated, refreshing list...');
  loadTabs();
});