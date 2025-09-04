'use client';

import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function DynamicThemeColor() {
  const { theme } = useTheme();

  useEffect(() => {
    // Update the theme-color meta tag based on current theme
    const themeColor = theme === 'dark' ? '#030712' : '#f9fafb'; // gray-950 for dark, gray-50 for light
    
    // Find existing theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      // Create new meta tag if it doesn't exist
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      metaThemeColor.setAttribute('content', themeColor);
      document.head.appendChild(metaThemeColor);
    }
  }, [theme]);

  return null;
}
