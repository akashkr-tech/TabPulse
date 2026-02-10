// TabPulse - Main Popup Script
document.addEventListener('DOMContentLoaded', function() {
  console.log('TabPulse popup loaded ⚡');
  loadTabs();
  setupButtons();
  setupSearch();
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
        console.log('New tab created ');
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
  if(groupByDomainBtn){
    groupByDomainBtn.addEventListener('click',async function(){
      try{
        await groupTabsByDomain();
        console.log('Tabs grouped by domain');
      }catch(error){
        console.error('Error grouping tabs:',error);
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

// group tabs by domain

async function groupTabsByDomain(){
  try{
    //get all tabs in current window
    let tabs = await chrome.tabs.query({currentWindow:true});

    //create a map to score tabs by domain
    let domainMap ={};

    //group tabs by their domain
    for(let i=0 ;i< tabs.length; i++){
        let tab = tabs[i];

        //skip chrome:// and extention URls
        if(tab.url.startsWith('chrome://') || tab.url.startsWith ('chrome-extension://')){
          continue;
        }
        try{
          let url = new URL(tab.url);
          let domain = url.hostname;

          // Remove 'www ' from domain

          domain = domain.replace('www.' , '');

          //initialized array for this domain if not exists

          if(!domainMap[domain]){
            domainMap[domain] = [];
          }

          domainMap[domain].push(tab.id);
        }catch(e){
          console.log('could not parse URL:',tab.url);

        }
    }

    //colors for grouping (nice variety)
        let colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
        let colorIndex = 0;

        // Create groups for each domain
        for(let domain in domainMap){
          let tabIds = domainMap[domain];

          // Only create group if there are multiple tabs from same domain
          if(tabIds.length > 1){
            //create the group

            let groupId = await chrome.tabs.group({tabIds:tabIds});

            //set group title and color

            await chrome.tabGroups.update(groupId,{
              title:domain + '(' + tabIds.length + ')',
              color:colors[colorIndex % colors.length]
            });

            colorIndex++;
          }
        }

         // Refresh the popup to show updated state
         setTimeout(function(){
          loadTabs();
         },500);
  }catch(error){
    console.error('Error in grouptabsByDomain:' , error);
  }

}