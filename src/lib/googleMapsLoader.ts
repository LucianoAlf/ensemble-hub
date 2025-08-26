// Centralized Google Maps API loader
declare global {
  interface Window {
    google?: any;
    gmapsReady?: () => void;
  }
}

export function loadGoogleMaps(key: string): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=places&callback=gmapsReady&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;

    window.gmapsReady = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Falha ao carregar Google Maps'));
    };

    document.head.appendChild(script);
  });
}