// electron-webview.d.ts
interface HTMLWebViewElement extends HTMLElement {
    // Navigation methods
    getURL(): string;
    loadURL(url: string): void;
    reload(): void;
    goBack(): void;
    goForward(): void;
    
    // Navigation state
    canGoBack(): boolean;
    canGoForward(): boolean;
    
    // Developer tools
    openDevTools(): void;
    closeDevTools(): void;
    isDevToolsOpened(): boolean;
    
    // Events available in webview
    addEventListener(event: 'dom-ready', listener: () => void): void;
    addEventListener(event: 'did-start-loading', listener: () => void): void;
    addEventListener(event: 'did-stop-loading', listener: () => void): void;
    addEventListener(event: 'page-title-updated', listener: (event: { title: string }) => void): void;
    addEventListener(event: string, listener: any): void;
    
    removeEventListener(event: string, listener: any): void;
  }
