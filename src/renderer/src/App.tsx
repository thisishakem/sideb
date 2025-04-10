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

function App(): JSX.Element {
  const webviewRef = useRef<ElectronWebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('https://www.google.com');
  const [title, setTitle] = useState('Google');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Update navigation states
  const updateNavigationState = () => {
    const webview = webviewRef.current;
    if (webview) {
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    }
  };

  useEffect(() => {
    const webview = webviewRef.current;
    
    if (webview) {
      const handleDomReady = () => {
        setIsLoading(false);
        updateNavigationState();
        console.log('Webview loaded successfully');
      };
      
      const handleTitleUpdate = (event: any) => {
        setTitle(event.title);
      };
      
      const handleStartLoading = () => {
        setIsLoading(true);
      };
      
      const handleStopLoading = () => {
        setIsLoading(false);
        setUrl(webview.getURL());
        updateNavigationState();
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
  }, []);

  const handleRefresh = () => {
    const webview = webviewRef.current;
    if (webview) {
      webview.reload();
    }
  };

  const handleBack = () => {
    const webview = webviewRef.current;
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  };

  const handleForward = () => {
    const webview = webviewRef.current;
    if (webview && webview.canGoForward()) {
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

  return (
    <div className="container">
      <div className="header">
        <h1>Google Browser</h1>
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
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="url-input"
              placeholder="Search Google or enter URL"
              title={title}
            />
            <button type="submit" className="go-button" title="Go">
              Go
            </button>
          </form>
        </div>
        <div className="page-info">
          {isLoading ? <div className="loading-indicator">Loading...</div> : title}
        </div>
      </div>
      
      <webview
        ref={webviewRef as any}
        src="https://www.google.com"
        className="webview-container"
      ></webview>
      
      <div className="footer">
        <p>© {new Date().getFullYear()} Google Browser - An Electron WebView Example</p>
      </div>
    </div>
  )
}

export default App
