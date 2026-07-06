import * as React from "react";

const DESKTOP_BREAKPOINT = 1024;

export function useSurface(): 'desktop' | 'mobile' {
  const [surface, setSurface] = React.useState<'desktop' | 'mobile'>('desktop');

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSurface(e.matches ? 'desktop' : 'mobile');
    };
    
    // Initial check
    onChange(mql);
    
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return surface;
}
