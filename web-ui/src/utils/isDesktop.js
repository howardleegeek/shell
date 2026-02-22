// Detect whether the app is running in a desktop environment (Taöuri-like).
// In pure Web App mode, this will return false since @tauri-apps/api isn't loaded.
export function isDesktop() {
  if (typeof window === 'undefined') return false;
  // Tauri injects a global object on the window: window.__TAURI__
  try {
    return !!(window && window.__TAURI__);
  } catch {
    return false;
  }
}
