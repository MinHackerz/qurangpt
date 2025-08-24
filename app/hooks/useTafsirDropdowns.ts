'use client';

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import TafsirDropdown from '../components/TafsirDropdown';

export const useTafsirDropdowns = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    if (!containerRef.current) return;

    // Find all tafsir dropdown containers
    const tafsirContainers = containerRef.current.querySelectorAll('.tafsir-dropdown-container');
    const cleanupFunctions: (() => void)[] = [];

    tafsirContainers.forEach((container) => {
      const surahNumber = parseInt(container.getAttribute('data-surah') || '1');
      const ayahNumber = parseInt(container.getAttribute('data-ayah') || '1');

      // Create React root and render TafsirDropdown
      const root = createRoot(container);
      root.render(TafsirDropdown({ surahNumber, ayahNumber }));

      // Store cleanup function
      cleanupFunctions.push(() => {
        root.unmount();
      });
    });

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [containerRef]);
};
