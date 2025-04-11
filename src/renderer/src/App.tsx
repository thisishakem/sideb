import { useRef, useEffect, useState } from 'react'

// Define the webview interface
interface ElectronWebView extends HTMLElement {
  getURL(): string;
  loadURL(url: string): void;
  reload(): void;
  goBack(): void;
  goForward(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  openDevTools(): void;
  executeJavaScript(code: string): Promise<any>;
}

// Define Tab interface
interface Tab {
  id: string;
  title: string;
  url: string;
  unread?: boolean;
}

// Helper function to get domain from URL
const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Get domain initial for display
const getDomainInitial = (url: string) => {
  try {
    const domain = getDomainFromUrl(url);
    const cleanDomain = domain.replace(/^www\./, '');
    return cleanDomain.charAt(0).toUpperCase();
  } catch {
    return 'N';
  }
};

// Get a color based on the domain
const getColorForDomain = (url: string) => {
  const domain = getDomainFromUrl(url);
  
  // Simple hash function to generate a color
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 60%)`;
};

// Check if URL is secure (https)
const isSecureUrl = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

function App() {
  const webviewRef = useRef<ElectronWebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [url, setUrl] = useState('https://www.google.com');
  const [title, setTitle] = useState('Google');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [showUrlIcon, setShowUrlIcon] = useState(true);
  
  // Tabs state
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Google', url: 'https://www.google.com', unread: false },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  // Update navigation states
  const updateNavigationState = () => {
    const webview = webviewRef.current;
    if (webview) {
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
      
      // Check if URL is secure
      const currentUrl = webview.getURL();
      setIsSecure(isSecureUrl(currentUrl));
    }
  };

  useEffect(() => {
    const webview = webviewRef.current;
    
    if (webview) {
      const handleDomReady = () => {
        setIsLoading(false);
        setLoadingProgress(100);
        updateNavigationState();
        console.log('Webview loaded successfully');
      };
      
      const handleTitleUpdate = (event: any) => {
        setTitle(event.title);
        
        // Update tab title
        updateCurrentTab({ title: event.title });
      };
      
      const handleStartLoading = () => {
        setIsLoading(true);
        setLoadingProgress(10);
        
        // Simulate progress
        let progress = 10;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress > 90) {
            clearInterval(interval);
            progress = 90;
          }
          setLoadingProgress(progress);
        }, 200);
        
        // Clear interval after 5 seconds if loading takes too long
        setTimeout(() => {
          clearInterval(interval);
        }, 5000);
      };
      
      const handleStopLoading = () => {
        setIsLoading(false);
        setLoadingProgress(100);
        const currentUrl = webview.getURL();
        setUrl(currentUrl);
        
        // Update tab URL
        updateCurrentTab({ url: currentUrl });
        
        updateNavigationState();
        
        // Reset progress after a brief delay
        setTimeout(() => {
          setLoadingProgress(0);
        }, 500);
      };

      // Add event listeners
      webview.addEventListener('dom-ready', handleDomReady);
      webview.addEventListener('page-title-updated', handleTitleUpdate);
      webview.addEventListener('did-start-loading', handleStartLoading);
      webview.addEventListener('did-stop-loading', handleStopLoading);
      
      // Clean up function
      return () => {
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('page-title-updated', handleTitleUpdate);
        webview.removeEventListener('did-start-loading', handleStartLoading);
        webview.removeEventListener('did-stop-loading', handleStopLoading);
      };
    }
  }, [activeTabId]);
  
  // Update current tab information
  const updateCurrentTab = (updates: Partial<Tab>) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    ));
  };

  const handleRefresh = () => {
    const webview = webviewRef.current;
    if (webview) {
      webview.reload();
    }
  };

  const handleBack = () => {
    const webview = webviewRef.current;
    if (webview && canGoBack) {
      webview.goBack();
    }
  };

  const handleForward = () => {
    const webview = webviewRef.current;
    if (webview && canGoForward) {
      webview.goForward();
    }
  };

  const handleUrlChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigateToUrl(url);
  };

  const navigateToUrl = (inputUrl: string) => {
    const webview = webviewRef.current;
    if (webview) {
      let newUrl = inputUrl.trim();
      
      // Handle search queries
      if (!newUrl.includes('.') || newUrl.includes(' ')) {
        newUrl = `https://www.google.com/search?q=${encodeURIComponent(newUrl)}`;
      } 
      // Add https if missing
      else if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        newUrl = 'https://' + newUrl;
      }
      
      webview.loadURL(newUrl);
    }
  };

  const handleUrlInputFocus = () => {
    // Select all text in the input when focused
    const urlInput = document.querySelector('.url-input') as HTMLInputElement;
    if (urlInput) {
      urlInput.select();
    }
    setShowUrlIcon(false);
  };

  const handleUrlInputBlur = () => {
    setShowUrlIcon(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // Reset URL to current page on Escape
      const webview = webviewRef.current;
      if (webview) {
        setUrl(webview.getURL());
      }
      (e.target as HTMLInputElement).blur();
    }
  };
  
  // Add new tab
  const addNewTab = () => {
    const newTabId = `tab-${Date.now()}`;
    setTabs([...tabs, { 
      id: newTabId, 
      title: 'New Tab', 
      url: 'https://www.google.com',
      unread: false
    }]);
    setActiveTabId(newTabId);
    
    // Reset states for new tab
    setUrl('https://www.google.com');
    setTitle('New Tab');
    setIsLoading(true);
  };
  
  // Switch to tab
  const switchToTab = (tabId: string) => {
    // Find the tab
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      setUrl(tab.url);
      setTitle(tab.title);
      
      // Mark as read when switching to tab
      if (tab.unread) {
        setTabs(prevTabs => prevTabs.map(t => 
          t.id === tabId ? { ...t, unread: false } : t
        ));
      }
      
      // Load the tab's URL in the webview
      const webview = webviewRef.current;
      if (webview) {
        webview.loadURL(tab.url);
      }
    }
  };
  
  // Close tab function
  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tab selection when closing
    
    if (tabs.length === 1) {
      // Don't close the last tab, create a new empty one instead
      const newTab = { 
        id: `tab-${Date.now()}`, 
        title: 'New Tab', 
        url: 'https://www.google.com',
        unread: false
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
      setUrl('https://www.google.com');
      setTitle('New Tab');
    } else {
      // Remove the tab
      const newTabs = tabs.filter(tab => tab.id !== tabId);
      setTabs(newTabs);
      
      // If we're closing the active tab, switch to another tab
      if (tabId === activeTabId) {
        const index = tabs.findIndex(tab => tab.id === tabId);
        const newActiveTab = tabs[index === 0 ? 1 : index - 1];
        setActiveTabId(newActiveTab.id);
        setUrl(newActiveTab.url);
        setTitle(newActiveTab.title);
        
        // Load the tab's URL in the webview
        const webview = webviewRef.current;
        if (webview) {
          webview.loadURL(newActiveTab.url);
        }
      }
    }
  };

  return (
    <div className="container">
      <div className="sidebar">
        {tabs.map(tab => (
          <div 
            key={tab.id} 
            className={`tab ${tab.id === activeTabId ? 'active' : ''} ${tab.unread ? 'unread' : ''}`}
            onClick={() => switchToTab(tab.id)}
            style={{ 
              position: 'relative' 
            }}
          >
            <div className="tab-tooltip">{tab.title}</div>
            <div className="tab-unread-indicator"></div>
            <div 
              className="tab-letter" 
              style={{ 
                backgroundColor: tab.id === activeTabId ? '#6988e6' : getColorForDomain(tab.url),
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                textTransform: 'uppercase'
              }}
            >
              {getDomainInitial(tab.url)}
            </div>
            
            {/* Close button */}
            <div 
              className="tab-close" 
              onClick={(e) => closeTab(tab.id, e)}
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                cursor: 'pointer',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => {
                (e.target as HTMLDivElement).style.opacity = '1';
                (e.target as HTMLDivElement).style.backgroundColor = '#666';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLDivElement).style.opacity = '0';
                (e.target as HTMLDivElement).style.backgroundColor = '#444';
              }}
            >
              ×
            </div>
          </div>
        ))}
        
        <div 
          className="add-tab" 
          onClick={addNewTab} 
          title="Add new tab"
        >
          +
        </div>
      </div>
      
      <div className="browser-content">
        <div className="header" style={{ position: 'relative' }}>
          <div className="navigation-bar">
            <button 
              onClick={handleBack} 
              disabled={!canGoBack}
              className="nav-button"
              title="Back"
            >
              ←
            </button>
            <button 
              onClick={handleForward} 
              disabled={!canGoForward}
              className="nav-button"
              title="Forward"
            >
              →
            </button>
            <button 
              onClick={handleRefresh}
              className="nav-button"
              title="Refresh"
            >
              ⟳
            </button>
            
            <form onSubmit={handleUrlChange} className="url-form">
              {showUrlIcon && (
                <div className="url-icon">
                  {isSecure ? '🔒' : '⚠️'}
                </div>
              )}
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={handleUrlInputFocus}
                onBlur={handleUrlInputBlur}
                onKeyDown={handleKeyDown}
                className="url-input"
                placeholder="Search Google or enter URL"
                title={title}
              />
              <button type="submit" className="go-button" title="Go">
                →
              </button>
            </form>
            
            <div className={`security-indicator ${isSecure ? 'secure' : 'not-secure'}`}>
              {isSecure ? 'Secure' : 'Not Secure'}
            </div>
            
            <div className="site-actions">
              <button className="site-actions-button" title="More options">
                ⋮
              </button>
            </div>
          </div>
          
          {/* Loading progress bar */}
          {loadingProgress > 0 && (
            <div 
              className={`progress-bar ${isLoading ? 'loading' : ''}`} 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          )}
        </div>
        
        <webview
          ref={webviewRef as any}
          src="https://www.google.com"
          className="webview-container"
        ></webview>
        
        <div className="footer">
          <p>© {new Date().getFullYear()} Sidebar Browser - An Electron WebView Example</p>
        </div>
      </div>
    </div>
  )
}

export default App;
