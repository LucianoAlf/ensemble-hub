// Centralized Google Maps API loader

export async function loadGoogleMaps(key: string) {
  if ((window as any).google?.maps) return;
  
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=places`;
    s.async = true; 
    s.defer = true;
    
    s.onload = () => {
      console.log('Google Maps API loaded successfully');
      resolve();
    };
    
    s.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error);
      reject(new Error("Falha ao carregar Google Maps"));
    };
    
    // Add error listener for API key issues
    (window as any).gm_authFailure = () => {
      console.error('Google Maps API authentication failed - check API key and domain restrictions');
      reject(new Error("Google Maps API authentication failed"));
    };
    
    document.head.appendChild(s);
  });
}