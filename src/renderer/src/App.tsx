import { useRef, useEffect } from 'react'

function App(): JSX.Element {
  const webviewRef = useRef<HTMLWebViewElement>(null);

  useEffect(() => {
    // You can add event listeners for the webview here if needed
    const webview = webviewRef.current;
    
    if (webview) {
      webview.addEventListener('dom-ready', () => {
        // Uncomment this line to open DevTools for the webview
        // webview.openDevTools();
        
        console.log('Webview loaded successfully');
      });
    }
    
    return () => {
      // Clean up event listeners if needed
      if (webview) {
        webview.removeEventListener('dom-ready', () => {});
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>Google in Electron</h1>
        <p>A simple Google webview wrapped in Electron</p>
      </div>
      
      {/* The webview tag is specific to Electron and allows embedding web content */}
      <webview
        ref={webviewRef}
        src="https://www.google.com"
        style={{
          width: '100%',
          height: '80vh',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}
      ></webview>
      
      <div className="footer">
        <p>Press <code>F12</code> to open DevTools for the Electron app</p>
        <p>You can send IPC messages between the main process and this renderer if needed</p>
      </div>
    </div>
  )
}

export default App