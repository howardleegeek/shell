export function isDesktop(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return typeof window !== 'undefined' && 'electron' in window;
}

export function isWeb(): boolean {
  return !isDesktop();
}
