import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Função utilitária para detectar dispositivos mobile via User-Agent
export function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window;
  const isSmallScreen = window.innerWidth <= MOBILE_BREAKPOINT;
  
  return isMobileUserAgent || (isTouchDevice && isSmallScreen);
}

// Hook combinado que considera tanto breakpoint quanto User-Agent
export function useIsMobileDevice() {
  const [isMobileDevice, setIsMobileDevice] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobile = detectMobileDevice();
      setIsMobileDevice(isMobile);
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)
    checkMobile()
    
    return () => mql.removeEventListener("change", checkMobile)
  }, [])

  return !!isMobileDevice
}
