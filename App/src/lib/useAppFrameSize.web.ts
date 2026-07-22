import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

/** The web build is pinned inside a phone-shaped #phone-frame div (see public/index.html)
 * that's centered and letterboxed in black rather than filling the real browser window.
 * Dimensions.get('window') still reports the full browser window, so anything sizing
 * itself from it (crop tools, full-bleed overlays, etc.) would size against the desktop
 * window instead of the much smaller phone frame. This measures the frame element itself,
 * falling back to the window if it isn't present (e.g. an embed without the wrapper). */
function measureFrame() {
  if (typeof document !== 'undefined') {
    const frame = document.getElementById('phone-frame');
    if (frame) {
      const rect = frame.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }
  }
  return Dimensions.get('window');
}

export function useAppFrameSize() {
  const [size, setSize] = useState(measureFrame);

  useEffect(() => {
    const onResize = () => setSize(measureFrame());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
