// Safe environment detection utilities
export interface EnvironmentInfo {
  isProduction: boolean;
  isSandbox: boolean;
  isDevelopment: boolean;
  canUseGooglePlaces: boolean;
  currentDomain: string;
}

export function getEnvironmentInfo(): EnvironmentInfo {
  const hostname = window.location.hostname;
  const isProduction = hostname === 'ensemble-hub.lovable.app';
  const isSandbox = hostname.includes('sandbox.lovable.dev') || hostname.includes('lovable.dev');
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Only allow Google Places in production with proper domain restriction
  const canUseGooglePlaces = isProduction && !isInIframe();
  
  return {
    isProduction,
    isSandbox,
    isDevelopment,
    canUseGooglePlaces,
    currentDomain: hostname
  };
}

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin, we're likely in an iframe
    return true;
  }
}