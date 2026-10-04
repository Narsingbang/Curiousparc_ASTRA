import { useState, useEffect } from 'react';

export function usePerformanceTier() {
  const [useFallback2D, setUseFallback2D] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // 1. Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    // 2. WebGL support check
    let hasWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      hasWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      hasWebGL = false;
    }

    // 3. Hardware concurrency & mobile check (Section 4.1 & 22A)
    const isMobile = window.innerWidth < 640;
    const lowConcurrency =
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 4;

    if (!hasWebGL || mediaQuery.matches || (isMobile && lowConcurrency)) {
      setUseFallback2D(true);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return {
    useFallback2D: useFallback2D || prefersReducedMotion,
    prefersReducedMotion,
  };
}
